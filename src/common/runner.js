var elementHelper = require('./element-helper');
var STATES = require('./runner-states');
var defaultOptions = require('./runner-options');

function Runner() {
  this.accessors = [];
  this.interval = defaultOptions.interval;
  this.waitForCheckInterval = defaultOptions.waitForCheckInterval;
  this.timeout = undefined;
  this.waitForTimeout = undefined;
  this.commands = {};
  this.accessors = {};
  this.accessorCommands = [];
  this.variables = {};
  this.STATES = STATES;
  this.ELEMENT_NOT_FOUND_ERROR = 'element could not be found';
}

Runner.prototype.callWhenReady = function (callback) {
  this.timeout = setTimeout(callback, this.interval);
};

Runner.prototype.findElement = function (locator, parent) {
  var element = elementHelper.find(locator, parent || document.documentElement);
  if (!element) {
    throw new Error(this.ELEMENT_NOT_FOUND_ERROR);
  }
  return element;
};

Runner.prototype.findElements = function (locator, parent) {
  return elementHelper.findAll(locator, parent || document.documentElement);
};

Runner.prototype.assertValue = function (input, value) {
  var regex;
  value = String(value || '');
  if (value.indexOf('regexp:') === 0) {
    regex = new RegExp(value.substring(7));
  } else if (value.indexOf('regexpi:') === 0) {
    regex = new RegExp(value.substring(8), 'i');
  } else if (typeof (input) === 'number' || /^\d+$|^\d+\.\d*$/.test(String(input).trim())) {
    if (value.indexOf('<=') === 0) {
      return parseFloat(input) <= parseFloat(value.substring(2));
    } else if (value.indexOf('>=') === 0) {
      return parseFloat(input) >= parseFloat(value.substring(2));
    } else if (value.indexOf('<') === 0) {
      return parseFloat(input) < parseFloat(value.substring(1));
    } else if (value.indexOf('>') === 0) {
      return parseFloat(input) > parseFloat(value.substring(1));
    } else {
      return String(input) === value;
    }
  } else if (typeof (input) === 'boolean') {
    return input;
  } else {
    return input.toLowerCase() === value.toLowerCase();
  }
  return regex.test(input);
};

Runner.prototype.onBeforeExecute = function (commands, index, callback) {
  callback(true);
};

Runner.prototype.onAfterExecute = function (commands, index, state, message, callback) {
  callback();
};

// borrowed from Selenium ide fork: https://github.com/FDIM/selenium/commit/2dbb4f2764c1e3d6f1c7c74bdbe9f896aaefafe8
Runner.prototype.injectVariables = function (str) {
  var stringResult = str;

  // Find all of the matching variable references
  ///////// only change is here to support . (dot) in variables
  var match = stringResult.match(/\$\{[^\}]+\}/g);
  if (!match) {
    return stringResult;
  }

  // For each match, lookup the variable value, and replace if found
  for (var i = 0; match && i < match.length; i++) {
    var variable = match[i]; // The replacement variable, with ${}
    var name = variable.substring(2, variable.length - 1); // The replacement variable without ${}
    // extension for default values support
    var defaultValue = false;
    if (name.indexOf('||') !== -1) {
      var parts = name.split('||');
      name = parts[0].trim();
      defaultValue = parts[1].trim();
    }
    var replacement = this.variables[name];
    if (!replacement && defaultValue) {
      if (/^["'].*["']$/.test(defaultValue)) {
        replacement = defaultValue.substring(1, defaultValue.length - 1);
      } else {
        replacement = this.variables[defaultValue];
      }
    }
    if (replacement && typeof (replacement) === 'string' && replacement.indexOf('$') != -1) {
      replacement = replacement.replace(/\$/g, '$$$$'); //double up on $'s because of the special meaning these have in 'replace'
    }
    if (replacement != undefined) {
      stringResult = stringResult.replace(variable, replacement);
    }
  }
  return stringResult;
};

Runner.prototype.start = function (commands, index, count, options, changeCallback) {
  this.stop();
  this.interval = options.interval || defaultOptions.interval;
  this.waitForCheckInterval = options.waitForCheckInterval || defaultOptions.waitForCheckInterval;

  if (!index) {
    index = 0;
  }
  if (!count) {
    count = commands.length - index;
  }

  var self = this, steps = 0;

  step(index);

  function step(index) {
    if (commands[index].type === 'comment') {
      self.callWhenReady(step.bind(this, index + 1));
    } else {
      self.onBeforeExecute(commands, index, function (shouldContinue) {
        steps++;
        if (shouldContinue) {
          self.execute(commands[index], index, (index, state, message) => {
            changeCallback(index, state, message);

            self.onAfterExecute(commands, index, state, message, function () {
              done(index, state);
            });
          });
        } else {
          done(index);
        }
      });
    }
  }

  function done(index, state) {
    if (state !== self.STATES.INPROGRESS && steps < count && index + 1 < commands.length) {
      self.callWhenReady(step.bind(this, index + 1));
    }
  }

};

Runner.prototype.stop = function () {
  clearTimeout(this.timeout);
  clearTimeout(this.waitForTimeout);
};

Runner.prototype.execute = function (command, index, changeCallback) {
  changeCallback(index, STATES.INPROGRESS);

  // handle variables
  command.command = this.injectVariables(command.command || '');
  command.locator = this.injectVariables(command.locator || '');
  command.value = this.injectVariables(command.value || '');

  var cmd = this.commands[command.command];
  // try accessorCommands if exact command is not available
  if (!cmd) {
    var prefix = this.accessorCommands.filter((c) => command.command.indexOf(c) === 0)[0];
    if (prefix) {
      var accessorName = command.command.substring(prefix.length);
      accessorName = accessorName.substring(0, 1).toLowerCase() + accessorName.substring(1);
      var accessor = this.accessors[accessorName];
      if (accessor) {
        try {
          command.accessor = accessor;
          command.input = accessor.call(this, command);
        } catch (err) {
          changeCallback(index, STATES.FAILED, accessorName + ' accessor: ' + (err.message || ''))
          return;
        }
        cmd = this.commands[prefix];
      }
    }
  }

  if (typeof (cmd) === 'function' && (!cmd.requiresAccessor || command.accessor)) {
    try {
      if (cmd.length > 1) { // uses callback
        cmd.call(this, command, (state, message) => {
          changeCallback(index, state, message);
        });
      } else {
        cmd.call(this, command);
        changeCallback(index, STATES.DONE);
      }
    } catch (err) {
      changeCallback(index, STATES.FAILED, err.message || "an error occured");
    }
  } else {
    changeCallback(index, STATES.FAILED, "unknown command");
  }
}

Runner.prototype.getSupportedCommands = function () {
  var list = [];
  // expose direct commands
  Object.keys(this.commands).forEach((cmd) => {
    if (!this.commands[cmd].requiresAccessor) {
      list.push({ value: cmd, title: cmd.substring(0, 1).toUpperCase() + cmd.substring(1) });
    }
  });
  // expose accessors
  var accessors = Object.keys(this.accessors);
  this.accessorCommands.forEach((prefix) => {
    accessors.forEach((cmd) => {
      cmd = cmd.substring(0, 1).toUpperCase() + cmd.substring(1);
      list.push({ value: prefix + cmd, title: prefix.substring(0, 1).toUpperCase() + prefix.substring(1) + ' ' + cmd });
    });
  });
  return list;
};

module.exports = new Runner();