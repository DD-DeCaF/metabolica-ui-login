import * as angular from 'angular';
import 'ngstorage';
import querystring from 'query-string';


function SessionFactory($http: ng.IHttpService, $localStorage, $rootScope, $log: ng.ILogService, $state, $mdToast) {
  return {
    isAuthenticated() {
      return !this.expired();
    },

    expired() {
      return !$localStorage.refresh_token || this.expires() <= new Date();
    },

    expires() {
      return new Date(JSON.parse($localStorage.refresh_token.exp) * 1000);
    },

    authorizationExpired() {
      return !$localStorage.authorization_token || this.authorizationExpires() <= new Date();
    },

    authorizationExpires() {
      return new Date(JSON.parse(atob($localStorage.authorization_token.split('.')[1])).exp * 1000);
    },

    getCurrentUser() {
      // metabolica-core user system is not in use
      return null;
    },

    refresh() {
      $log.info('Session: Refreshing authorization token');
      return $http.post(`${process.env.IAM_API}/refresh`, `refresh_token=${$localStorage.refresh_token.val}`, {
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      }).then(response => {
        $log.info('Session: Token refresh successful, saving new authorization token in local storage');
        $localStorage.authorization_token = response.data;
      }).catch(error => {
        $log.info(`Session: Token refresh failure`);
        $log.debug(error);
      });
    },

    authenticate(credentials, firebase) {
      const params = querystring.stringify(credentials);
      const endpoint = firebase ? '/authenticate/firebase' : '/authenticate/local';
      return $http.post(`${process.env.IAM_API}${endpoint}`, params, {
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      }).then(response => {
        $localStorage.authorization_token = response.data.jwt;
        $localStorage.refresh_token = response.data.refresh_token;
        $rootScope.$broadcast('session:login');
        $rootScope.isAuthenticated = true;
        $log.info(`Session: Authentication successful. Session expires: ${this.expires()}, authorization expires: ${this.authorizationExpires()}`);
      }).catch(error => {
        $log.info(`Session: Authentication failure`);
        $log.debug(error);
        throw error;
      });
    },

    invalidate() {
      $log.debug(`Session: Invalidating session and forcing user to re-login`);
      this.logout();
      $state.go('login').then(() => {
        $mdToast.show($mdToast.simple()
          .theme('warn-toast')
          .textContent('Your session has expired. Please log in again.')
          .hideDelay(6000)
          .action('close')
          .position('top right'));
      });
    },

    logout(next = null) {
      delete $localStorage.authorization_token;
      delete $localStorage.refresh_token;
      $rootScope.$broadcast('session:logout', {next});
      $rootScope.isAuthenticated = false;
    },

    login(next = null) {
      $state.go('login');
    }
  };
}

function SessionInterceptorFactory($q: ng.IQService, $injector: ng.auto.IInjectorService, appAuth) {

  // Points to any ongoing request for refreshing the authorization token. Further requests should wait for this promise to resolve.
  let refreshTokenPromise;

  return {
    request(config) {
      const $localStorage = $injector.get('$localStorage');
      const Session = $injector.get('Session');
      const $log = $injector.get('$log');

      // Ignore authorization logic:
      // - there is no active session
      // - for requests to refresh the authorization token
      // - for untrusted hosts
      if (!$localStorage.authorization_token ||
          config.url === `${process.env.IAM_API}/refresh` ||
          !appAuth.isTrustedURL(config.url)) {
        return config;
      }

      // If the session has expired, invalidate it and abort the request
      if (Session.expired()) {
        $log.info(`SessionInterceptor: Session has expired, aborting request`);
        Session.invalidate();
        config.timeout = $q.when();  // aborts the request
        return config;
      }

      // If the authorization token has expired, refresh it
      if (Session.authorizationExpired()) {
        $log.info(`SessionInterceptor: Request must wait for refreshed authorization token`);

        // Check for a reference to existing refresh request. If none, then create one
        if (!refreshTokenPromise) {
          $log.debug(`SessionInterceptor: Creating refresh request promise`);

          // Assign the promise so that further requests may wait for this promise to resolve
          refreshTokenPromise = Session.refresh();

          // Remove the assignment when the promise resolves
          refreshTokenPromise.finally(() => {
            $log.debug(`SessionInterceptor: Refresh request finished, removing promise`);
            refreshTokenPromise = undefined;
          });
        }

        // Wait for the refresh request promise, then add the new authorization token
        return refreshTokenPromise.then(() => {
          $log.debug(`SessionInterceptor: Adding authorization header for URL: ${config.url}`);
          config.headers.Authorization = `Bearer ${$localStorage.authorization_token}`;
          return config;
        }).catch(() => {
          $log.info(`SessionInterceptor: Auth token refresh failed, aborting request`);
          Session.invalidate();
          config.timeout = $q.when();  // aborts the request
          return config;
        });
      }

      // Add the current authorization token
      $log.debug(`SessionInterceptor: Adding authorization header for URL: ${config.url}`);
      config.headers.Authorization = `Bearer ${$localStorage.authorization_token}`;
      return config;
    },
    responseError(response) {
      // TODO this should only trigger for local API urls
      if (response.status === 401 && appAuth.isRequired) {
        $injector.get('Session').invalidate();
      }
      return $q.reject(response);
    }
  };
}

export const SessionModule = angular
  .module('decaf.session', [
    'ngStorage'
  ])
  .factory('Session', SessionFactory)
  .factory('sessionInterceptor', SessionInterceptorFactory)
  .run(($rootScope, $state, $location: ng.ILocationService, $log: ng.ILogService, $mdDialog, Session, Project, appAuth) => {

    if (!Session.isAuthenticated()) {
      $rootScope.isAuthenticated = false;
      if (appAuth.isRequired) {
        setTimeout(() => {
          let next;
          if (!$state.includes('login')) {
            next = $location.path();
          }
          $rootScope.$broadcast('session:logout', {next});
        }, 100);
      }
    } else {
      $rootScope.isAuthenticated = true;
      $log.debug("NOTE: metabolica-ui Session module is overridden, but may still produce invalid message 'Session expires ...' above");
    }
  });
