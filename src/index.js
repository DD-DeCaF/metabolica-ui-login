import angular from 'angular';
import {AppModule} from 'metabolica';
import {LoginModule} from './login/login.module';
export {LoginModule} from './login/login.module';
import {SessionModule} from './session/session.module';
export {SessionModule} from './session/session.module';

export const LoginAppModule = angular.module('LoginApp', [
  AppModule.name,
  LoginModule.name,
  SessionModule.name,
]);
