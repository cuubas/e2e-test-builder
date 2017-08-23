var ioproxy = require('../../../common/ioproxy');

function SettingsController($scope, $window, $element) {
  var $ctrl = this;

  $ctrl.$onInit = function () {

  };

  $ctrl.addExtension = function (ev) {
    ioproxy.open($window.localStorage.lastPath)
      .then((file) => {
        if (/\.js$/.test(file.path)) {
          $ctrl.extensions.push(file);
          $scope.$apply();
          $ctrl.saveExtensions();
        } else {
          handleError("Please select javascript file");
        }
      })
      .catch(handleError);
  };

  $ctrl.removeExtension = function (ev, ext) {
    var index = $ctrl.extensions.indexOf(ext);
    if (index >= 0) {
      $ctrl.extensions.splice(index, 1);
      $ctrl.saveExtensions();
    }
  };

  $ctrl.reloadExtensions = function () {
    $ctrl.reloadingExtensions = true;
    var index = 0;
    var step = function () {
      if (index >= $ctrl.extensions.length) {
        $ctrl.saveExtensions();
        $ctrl.reloadingExtensions = false;
        $scope.$apply();
        return;
      }
      ioproxy.read($ctrl.extensions[index].path)
        .then((file) => {
          $ctrl.extensions[index] = file;
          index++;
          step();
        })
        .catch((error) => {
          $ctrl.reloadingExtensions = false;
          $scope.$apply();
          handleError(error);
        });
    };
    step();
  };

  $ctrl.saveExtensions = function () {
    $window.localStorage.extensions = JSON.stringify($ctrl.extensions);
  };

  function handleError(error) {
    alert(error);
  }
}

module.exports = function (module) {
  module.controller('SettingsController', SettingsController);
}
