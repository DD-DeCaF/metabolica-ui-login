import angular from 'angular';
import 'angular-ui-router';
import {LoginSocialComponent} from './login.component';

export const LoginModule = angular.module('loginSocial', ['ui.router'])
  .component('login', LoginSocialComponent)
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
