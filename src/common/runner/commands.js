var runner = require('./../runner');
// list all commands that accept accessor input
runner.accessorCommands.push('assert', 'verify', 'echo', 'store');

runner.commands.assert = function (command) {
  if (!runner.assertValue(command.input || command.locator, command.value)) {
    throw new Error("assert failed: " + (command.input || command.locator) + ' doesn\'t match ' + command.value);
  }
};

runner.commands.verify = function (command) {
  if (!runner.assertValue(command.input || command.locator, command.value)) {
    throw new Error("verify failed: " + (command.input || command.locator) + ' doesn\'t match ' + command.value);
  }
};

runner.commands.click = function (command) {
  var element = this.findElement(command.locator);
  element.scrollIntoViewIfNeeded();
  element.click();
};

runner.commands.focus = function (command) {
  var element = this.findElement(command.locator);
  element.scrollIntoViewIfNeeded();
  element.focus();
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

runner.commands.type = function (command) {
  var element = this.findElement(command.locator);
  element.scrollIntoViewIfNeeded();
  element.value = command.value;
  element.dispatchEvent(new Event('change'));
};

runner.commands.sendKeys = function (command) {
  var element = this.findElement(command.locator);
  element.scrollIntoViewIfNeeded();
  var chars = command.value.split('');
  chars.forEach(runner.simulateKeyInput.bind(runner, element));
};
