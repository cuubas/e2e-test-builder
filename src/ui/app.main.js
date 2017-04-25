var angular = require('angular');
require('angular-sortable-view');

var app = angular.module('E2EUI', [
  require('angular-route'),
  'angular-sortable-view'
]);

// source in extra components
require('./components/list/list.component')(app);

// routes
require('./home/home.controller')(app);
require('./install/install.controller')(app);

app.constant('RequiredNativeClientVersion', 1);

// configure router
app.config(function ($routeProvider, RequiredNativeClientVersion) {
  $routeProvider
    .when('/home', {
      controller: 'HomeController',
      controllerAs: '$ctrl',
      template: require('./home/home.partial.html'),
    })
    .when('/install', {
      controller: 'InstallController',
      controllerAs: '$ctrl',
      template: require('./install/install.partial.html'),
    })
    .otherwise({
      redirectTo: function () {
        return parseInt(window.localStorage.nativeClientVersion) === RequiredNativeClientVersion ? '/home' : '/install'
      }
    });
});

// register this window with background page (in case window is reloaded)
chrome.runtime.getBackgroundPage((page)=>{
  page.$registerUiWindow(window);
});