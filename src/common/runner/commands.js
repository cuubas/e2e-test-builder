var runner = require('./../runner');
// list all commands that accept accessor input
runner.accessorCommands.push('assert', 'verify', 'echo', 'store');

runner.commands.assert = function (command) {

};

runner.commands.verify = function (command) {
  throw new Error('verify not implemented');
};

runner.commands.click = function (command) {
  var element = this.findElement(command.locator);
  element.scrollIntoViewIfNeeded();
  element.click();
};

runner.commands.sleep = function (command, callback) {
  var timeout = parseInt(command.value || command.locator);
  if (isNaN(timeout)) {
    timeout = 1000;
  }
  setTimeout(() => {
    callback(this.STATES.DONE);
  }, timeout);
};

runner.commands.store = function (command) {
  if (command.value) {
    runner.variables[command.value] = command.input !== undefined ? command.input : command.locator;
  }
};

runner.commands.echo = function (command, callback) {
  callback(this.STATES.DONE, command.input !== undefined ? command.input : command.locator || command.value);
};

runner.commands.eval = function (command) {
  var element;
  try {
    element = this.findElement(command.locator);
    return eval(command.value);
  } catch (err) {
    eval(command.locator);
  }
};
