var ioproxy = require('./../../common/ioproxy');

function InstallController($window, $scope, RequiredNativeClientVersion, $location) {
  var $ctrl = this;

  var name = 'host.zip';

  $ctrl.executable = 'register.sh';

  if ($window.navigator.platform === 'Win32') {
    name = 'host-win.zip';
    $ctrl.executable = 'register.bat';
  }
  $ctrl.nativeClientVersion = $window.localStorage.nativeClientVersion;
  $ctrl.hostLink = 'https://github.com/Cuubas/e2e-test-builder/releases/download/v1.0.0/' + name;
  $ctrl.verify = verify;

  function verify() {
    ioproxy.about().then((about) => {
      if (about.version === RequiredNativeClientVersion) {
        $window.localStorage.nativeClientVersion = String(about.version);
        $scope.$apply(() => {
          $location.path('/home');
        });
      } else {
        alert("Version " + RequiredNativeClientVersion + " is required, found version " + about.version + ".");
      }
    }).catch((error) => {
      alert(error);
    })
  }
}

module.exports = function (module) {
  module.controller('InstallController', InstallController);
}