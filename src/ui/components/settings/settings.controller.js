var ioproxy = require('../../../common/ioproxy');

function SettingsController($scope, $window, $element) {
  var $ctrl = this;

  $ctrl.$onInit = function () {

  };

  $ctrl.addExtension = function (ev) {
    ioproxy.open($window.localStorage.lastPath)
      .then((file) => {
        if (/\.js$/.test(file.path)) {
          $ctrl.settings.extensions.push(file);
          $scope.$apply();
        } else {
          handleError("Please select javascript file");
        }
      })
      .catch(handleError);
  };

  $ctrl.removeExtension = function (ev, ext) {
    var index = $ctrl.settings.extensions.indexOf(ext);
    if (index >= 0) {
      $ctrl.settings.extensions.splice(index, 1);
    }
  };

  function handleError(error) {
    alert(error);
  }
}

module.exports = function (module) {
  module.controller('SettingsController', SettingsController);
}
