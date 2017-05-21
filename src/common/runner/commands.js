var runner = require('./../runner');
// list all commands that accept accessor input
runner.accessorCommands.push('waitForNot', 'waitFor', 'assertNot', 'assert', 'verifyNot', 'verify', 'echo', 'store');

runner.commands.assert = function (command) {
  if (!runner.assertValue(typeof (command.input) !== 'undefined' ? command.input : command.locator, command.value)) {
    throw new Error("assert failed: " + (typeof (command.input) !== 'undefined' ? command.input : command.locator) + ' doesn\'t match ' + command.value);
  }
};
runner.commands.assertNot = function (command) {
  if (runner.assertValue(typeof (command.input) !== 'undefined' ? command.input : command.locator, command.value)) {
    throw new Error("assert failed: " + (typeof (command.input) !== 'undefined' ? command.input : command.locator) + ' doesn\'t match ' + command.value);
  }
};
runner.commands.verify = function (command) {
  // TODO: this should terminate test
  if (!runner.assertValue(typeof (command.input) !== 'undefined' ? command.input : command.locator, command.value)) {
    throw new Error("verify failed: " + (typeof (command.input) !== 'undefined' ? command.input : command.locator) + ' doesn\'t match ' + command.value);
  }
};

runner.commands.verifyNot = function (command) {
  if (runner.assertValue(typeof (command.input) !== 'undefined' ? command.input : command.locator, command.value)) {
    throw new Error("verify failed: " + (typeof (command.input) !== 'undefined' ? command.input : command.locator) + ' doesn\'t match ' + command.value);
  }
};

runner.commands.waitFor = function (command, callback) {
  var test = () => {
    if (runner.assertValue(command.input, command.value)) {
      callback(runner.STATES.DONE);
    } else {
      runner.waitForTimeout = setTimeout(() => {
        command.input = command.accessor.call(runner, command); // invoke accessor again
        runner.callWhenReady(test);
      }, runner.waitForCheckInterval);
    }
  };
  test();
};
runner.commands.waitFor.requiresAccessor = true; // cannot be used directly

runner.commands.waitForNot = function (command, callback) {
  var test = () => {
    if (!runner.assertValue(command.input, command.value)) {
      callback(runner.STATES.DONE);
    } else {
      runner.waitForTimeout = setTimeout(() => {
        command.input = command.accessor.call(runner, command); // invoke accessor again
        runner.callWhenReady(test);
      }, runner.waitForCheckInterval);
    }
  };
  test();
};
runner.commands.waitForNot.requiresAccessor = true; // cannot be used directly

runner.commands.open = function (command) {
  window.location.href = command.locator || command.value;
};

runner.commands.refresh = function (command) {
  window.location.reload();
};

runner.commands.click = function (command) {
  var element = this.findElement(command.locator);
  element.scrollIntoViewIfNeeded();
  element.click();
};

runner.commands.focus = function (command) {
  var element = this.findElement(command.locator);
  element.scrollIntoViewIfNeeded();
  element.dispatchEvent(new FocusEvent('focus'));
};

runner.commands.select = function (command) {
  var element = this.findElement(command.locator);
  element.scrollIntoViewIfNeeded();
  var parts = command.value.split('=');
  if (parts.length === 1) {
    parts.unshift('label');
  }
  if (parts[0] === 'label' || parts[0] === 'value') {
    // go through all options
    var option;
    for (var i = 0, len = element.options.length; i < len; i++) {
      option = element.options[i];
      if (runner.assertValue(parts[0] === 'value' ? option.value : option.textContent, parts[1])) {
        option.selected = true;
      }
    }
  } else if (parts[0] === 'index') {
    element.selectedIndex = parseInt(parts[1]);
  } else {
    throw new Error('unsupported strategy: ' + parts[0]);
  }
  element.dispatchEvent(new Event('change'));
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
    eval(command.value);
  }
};

runner.commands.type = function (command) {
  var element = this.findElement(command.locator);
  element.scrollIntoViewIfNeeded();
  element.dispatchEvent(new FocusEvent('focus'));
  element.value = command.value;
  element.dispatchEvent(new Event('change'));
};

runner.commands.clear = function (command) {
  var element = this.findElement(command.locator);
  element.scrollIntoViewIfNeeded();
  element.dispatchEvent(new FocusEvent('focus'));
  element.value = '';
  element.dispatchEvent(new Event('change'));
};

runner.commands.sendKeys = function (command) {
  var element = this.findElement(command.locator);
  element.scrollIntoViewIfNeeded();
  element.dispatchEvent(new FocusEvent('focus'));
  var chars = command.value.split('');
  chars.forEach(runner.simulateKeyInput.bind(runner, element));
};
