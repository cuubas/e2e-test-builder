runner.commands.alert = function (command) {
  alert(command.command + '|' + command.locator + '|' + command.value);
};

// wait for angular / skip commands
runner.onBeforeExecute = function (commands, index, callback) {
  console.info("executing", commands[index]);
  callback(true); // false will skip command execution
  //angular.getTestability(document).whenStable(callback); 
};
console.info('angular');