import { runner } from 'app/common/runner';
import { safeEval } from 'app/common/safe-eval';
// list all commands that accept accessor input
runner.accessorCommands.push('waitForNot', 'waitFor', 'assertNot', 'assert', 'verifyNot', 'verify', 'echo', 'store', 'breakIf', 'continueIf');

runner.commands.assert = function (command) {
  if (!runner.assertValue(typeof (command.input) !== 'undefined' ? command.input : command.locator, command.value)) {
    throw new Error('assert failed: ' + (typeof (command.input) !== 'undefined' ? command.input : command.locator) + ' doesn\'t match ' + command.value);
  }
};
runner.commands.assertNot = function (command) {
  if (runner.assertValue(typeof (command.input) !== 'undefined' ? command.input : command.locator, command.value)) {
    throw new Error('assert failed: ' + (typeof (command.input) !== 'undefined' ? command.input : command.locator) + ' doesn\'t match ' + command.value);
  }
};
runner.commands.verify = function (command) {
  // TODO: this should terminate test
  if (!runner.assertValue(typeof (command.input) !== 'undefined' ? command.input : command.locator, command.value)) {
    throw new Error('verify failed: ' + (typeof (command.input) !== 'undefined' ? command.input : command.locator) + ' doesn\'t match ' + command.value);
  }
};

runner.commands.verifyNot = function (command) {
  if (runner.assertValue(typeof (command.input) !== 'undefined' ? command.input : command.locator, command.value)) {
    throw new Error('verify failed: ' + (typeof (command.input) !== 'undefined' ? command.input : command.locator) + ' doesn\'t match ' + command.value);
  }
};

runner.commands.waitFor = function (command, callback) {
  const test = () => {
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
  const test = () => {
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
  const element = this.findElement(command.locator);
  element.scrollIntoViewIfNeeded();
  element.click();
};

runner.commands.focus = function (command) {
  const element = this.findElement(command.locator);
  element.scrollIntoViewIfNeeded();
  element.dispatchEvent(new FocusEvent('focus'));
};

runner.commands.select = function (command) {
  const element = this.findElement(command.locator);
  element.scrollIntoViewIfNeeded();
  const parts = command.value.split('=');
  if (parts.length === 1) {
    parts.unshift('label');
  }
  if (parts[0] === 'label' || parts[0] === 'value') {
    // go through all options
    let option;
    for (let i = 0, len = element.options.length; i < len; i++) {
      option = element.options[i];
      if (runner.assertValue(parts[0] === 'value' ? option.value : option.textContent, parts[1])) {
        option.selected = true;
      }
    }
  } else if (parts[0] === 'index') {
    element.selectedIndex = parseInt(parts[1], 10);
  } else {
    throw new Error('unsupported strategy: ' + parts[0]);
  }
  element.dispatchEvent(new Event('change'));
};

runner.commands.sleep = function (command, callback) {
  let timeout = parseInt(command.value || command.locator, 10);
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
  callback(this.STATES.DONE, (command.input !== undefined ? command.input : (command.locator || command.value)) as string);
};

runner.commands.eval = function (command) {
  try {
    const element = this.findElement(command.locator);
    return safeEval({ element: element }, command.value);
  } catch (err) {
    safeEval({}, command.value || command.locator);
  }
};

runner.commands.type = function (command) {
  const element = this.findElement(command.locator);
  element.scrollIntoViewIfNeeded();
  element.dispatchEvent(new FocusEvent('focus'));
  element.value = '';
  const chars = command.value.split('');
  chars.forEach(runner.simulateKeyInput.bind(runner, element));
};

runner.commands.clear = function (command) {
  const element = this.findElement(command.locator);
  element.scrollIntoViewIfNeeded();
  element.dispatchEvent(new FocusEvent('focus'));
  element.value = '';
  element.dispatchEvent(new Event('change'));
};

runner.commands.sendKeys = function (command) {
  const element = this.findElement(command.locator);
  element.scrollIntoViewIfNeeded();
  element.dispatchEvent(new FocusEvent('focus'));
  const chars = command.value.split('');
  chars.forEach(runner.simulateKeyInput.bind(runner, element));
};

// flow control
runner.commands.continueIf = skipNextBlockIfNeeded.bind(runner, false);
runner.commands.breakIf = skipNextBlockIfNeeded.bind(runner, true);

function skipNextBlockIfNeeded(negate, commands, index, callback) {
  const command = commands[index];
  let result;
  // support legacy format when expression was in value e.g. data.size > 5 or foo=='e' or baz>=5 || !baz
  if (!command.locator && command.value) {
    const expr = command.value.replace(/(^|[^'"])([a-zA-Z\.]+)([^'"]|$)/g, '$1variables[\'$2\']');
    if (expr.indexOf('variables[') === -1) {
      callback(runner.STATES.FAILED, 'condition doesn\'t include a variable');
      return;
    }
    result = safeEval({ variables: runner.variables }, expr);
  } else {
    result = runner.assertValue(typeof (command.input) !== 'undefined' ? command.input : command.locator, command.value);
  }
  if (negate) {
    result = !result;
  }
  if (!result) {
    // skip all commands till comment or end
    for (let i = index + 1; i < commands.length; i++) {
      if (commands[i].type === 'comment') {
        break;
      }
      commands[i].$skip = true;
    }
  }
  callback(runner.STATES.DONE);
}
