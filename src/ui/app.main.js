var angular = require('angular');
var app = angular.module('E2EUI', []);
var messenger = require("./../common/messenger");

require('./components/list/list.component')(app);