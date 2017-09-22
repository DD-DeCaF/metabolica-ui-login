import * as template from './login.component.html';
import './login.component.scss';
import * as firebase from "firebase";

firebase.initializeApp({
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_SENDER_ID
});

interface Credentials {
    username: string;
    password: string;
}

/** This class is LoginComponent's controller */
class LoginSocialController {
    appName: string;
    credentials: Credentials;
    authenticate: (form: any, credentials: Credentials, socialAuth: boolean) => void;
    signInWithSocial: (form: any, provider: string) => void;

    /**
     * LoginController class constructor
     * @param Session  comment login Session parameter
     * @param appName  The application name to show during login
     */
    constructor($scope, $timeout, $state, $stateParams, $location, $window, Session, appName: string) {
        this.appName = appName;
        this.credentials = {
            username: '',
            password: ''
        };

        this.authenticate = async (form: any, credentials: Credentials, socialAuth: boolean = false) => {
            try {
                await Session.authenticate(credentials);
                if (socialAuth) {
                    // need to refresh the page before proceeding
                    $timeout(() => {
                        $window.location.href = '/app/home';
                    }, 100);
                    return;
                }

                if ($stateParams.next) {
                    $timeout(() => {
                        $location
                            .path(decodeURIComponent($stateParams.next))
                            .search({}); // clear the next param
                    }, 100);
                } else {
                    $state.go('app.home');
                }
            } catch (invalidCredentials) {
                form.password.$setValidity('auth', false);
                form.$setPristine();
                $scope.$apply();
            }
        };

        /** @method signInWithSocial
         * @param form  LoginForm
         * @param provider  a string with the provider id ("google" or "github")
         * @returns Uses Firebase to provide the authentication with Github and Google
         */
        this.signInWithSocial = (form: any, provider: string) => {
            firebase.auth().signOut();
            let providers = {
                'google': new firebase.auth.GoogleAuthProvider(),
                'github': new firebase.auth.GithubAuthProvider(),
            };
            firebase.auth().signInWithPopup(providers[provider]).then((result) => {
                firebase.auth().currentUser.getToken(true).then((idToken) => {
                    this.authenticate(form, {'username': result.user.uid, 'password': idToken}, true);
                }).catch(function(error) {
                    console.log(error);
                });
            }).catch(function(error) {
                console.log(error);
            });
        };
    }
}

export const LoginSocialComponent = {
    controller: LoginSocialController,
    controllerAs: 'ctrl',
    template: template.toString()
};