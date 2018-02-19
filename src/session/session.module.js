import angular from 'angular';
import 'ngstorage';
import querystring from 'query-string';


function SessionFactory($http, $localStorage, $rootScope, $log, $state) {
  return {
    isAuthenticated() {
      return !this.refreshExpired();
    },

    jwtExpired() {
      if (!$localStorage.jwt) {
        return true;
      }
      return this.jwtExpires() <= new Date();
    },

    jwtExpires() {
      if (!$localStorage.jwt) {
        return;
      }
      return new Date(JSON.parse(atob($localStorage.jwt.split('.')[1])).exp * 1000);
    },

    refreshExpired() {
      if (!$localStorage.refresh_token) {
        return true;
      }
      return this.refreshExpires() <= new Date();
    },

    refreshExpires() {
      if(!$localStorage.refresh_token) {
        return;
      }
      return new Date(JSON.parse($localStorage.refresh_token.exp) * 1000);
    },

    getCurrentUser() {
      // metabolica-core user system is not in use
      return null;
    },

    authenticate(credentials, firebase) {
      const params = querystring.stringify(credentials);
      const endpoint = firebase ? '/authenticate/firebase' : '/authenticate/local';
      return $http.post(`${process.env.IAM_API}${endpoint}`, params, {
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      }).then(response => {
        $log.info("Authentication successful, saving received tokens in local storage");
        $localStorage.jwt = response.data.jwt;
        $localStorage.refresh_token = response.data.refresh_token;
        $rootScope.$broadcast('session:login');
        $rootScope.isAuthenticated = true;
      }).catch(error => {
        $log.info(`Authentication failure`);
        $log.debug(error);
        throw error;
      });
    },

    logout(next = null) {
      delete $localStorage.jwt;
      delete $localStorage.refresh_token;
      $rootScope.$broadcast('session:logout', {next});
      $rootScope.isAuthenticated = false;
    },

    login(next = null) {
      $state.go('login');
    }
  };
}


// TODO: refresh token logic
function SessionInterceptorFactory($q, $injector, appAuth) {
  return {
    request(config) {
      let $localStorage = $injector.get('$localStorage');

      // Authorization header should be passed to trusted hosts only
      if ($localStorage.jwt && appAuth.isTrustedURL(config.url)) {
        config.headers.Authorization = `Bearer ${$localStorage.jwt}`;
      }
      return config;
    },
    responseError(response) {
      if (response.status === 401) {
        if (appAuth.isRequired) {
          $injector.get('Session').logout(location.pathname);
        }
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
  .run(function ($rootScope, $state, $location, $log, $mdDialog, Session, Project, appAuth) {

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
      $log.debug("NOTE: metabolica-ui Session module is overridden, but may still produce message 'Session expires undefined' above");
      $log.info(`Session expires: ${Session.refreshExpires()}, JWT expires: ${Session.jwtExpires()}`);
    }
  });
