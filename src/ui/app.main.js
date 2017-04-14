var angular = require('angular');
require('angular-sortable-view');

var app = angular.module('E2EUI', [
  require('angular-route'),
  'angular-sortable-view'
]);

// source in extra components
require('./components/list/list.component')(app);
require('./home/home.controller')(app);

// configure router
app.config(function ($routeProvider) {
  $routeProvider
    .when('/', {
      controller: 'HomeController',
      controllerAs: '$ctrl',
      template: require('./home/home.partial.html'),
    }).otherwise({
      redirectTo:'/'
    });
});