runner.commands.alert = function (command) {
  alert(command.command + '|' + command.locator + '|' + command.value);
};
runner.commands.ajax = function (command, callback) {
  pageProxy.run(function (command, callback) {
    jQuery.get(command.locator).success(function (content, status, response) {
      callback(response.status);
    }).error(function (response) {
      callback(response.status);
    });
  }, command, function (status) {
    callback(status === 200 ? runner.STATES.DONE : runner.STATES.FAILED);
  });
};
// angular detection and waiting
var ngProxy = pageProxy.create(function (callback) {
  if (window.angular) {
    // window.angular.getTestability(document).whenStable(function () { // somehow whenStable doesn't invoke the callback
    angular.element(document).injector().get('$timeout')(function () {
      callback(true);
    }, 0, true);
    // });
  } else {
    callback(true);
  }
});
// wait for angular / skip commands
runner.onBeforeExecute = function (commands, index, callback) {
  ngProxy.run(callback.bind(runner));
};

console.info('interval', settings.interval);

locators.css.classBlacklist.push(/wrap|column|top|row/);

locators.css.attributes.unshift('ng-bind', 'ng-model', 'ng-repeat', 'ng-click');
