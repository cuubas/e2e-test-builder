runner.commands.alert = function (command) {
  alert(command.command + '|' + command.locator + '|' + command.value);
};

// wait for angular / skip commands
runner.onBeforeExecute = function (commands, index, callback) {
  if (window.angular) {
    console.info("waiting for angular", commands[index]);
    window.angular.getTestability(document).whenStable(function () {
      console.info("executing", commands[index]);
      callback(true);
    });
  } else {
    console.info("executing", commands[index]);
    callback(true);
  }
};
console.info('angular');
console.info('interval', settings.interval);

locators.css.classBlacklist.push(/wrap|column|top|row/);

locators.css.attributes.unshift('ng-bind', 'ng-model', 'ng-repeat', 'ng-click');
