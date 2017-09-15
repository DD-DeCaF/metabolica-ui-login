import angular from 'angular';
import 'angular-ui-router';
import {LoginComponent} from './login.component';

export const LoginModule = angular.module('login', ['ui.router'])
    .component('login', LoginComponent)
	.config(function ($stateProvider, appAuthProvider) {
		appAuthProvider.isRequired = false;
        $stateProvider.state('login', {
            url: '/login?next',
            component: 'login',
            data: {
                title: 'login',
                hideMenus: true
            }
        });
    });
