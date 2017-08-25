import { find, findAll } from './element-helper';
import { COMMAND_STATE } from './runner/states';
import { TestCaseItem } from 'app/common/model';
import { Options } from './runner/options';

export class Runner {
  public commands: { [index: string]: RunnableCommand } = {};
  public accessors: { [index: string]: (command: RunnerCommand) => any } = {}
  public accessorCommands: string[] = [];
  public variables: { [index: string]: any } = {};
  public dialogs: { [index: string]: any } = {};
  public interval = Options.interval;
  public waitForCheckInterval = Options.waitForCheckInterval;
  public timeout;
  public waitForTimeout;
  public listeners: {
    onStart: ((shouldRun: boolean) => void)[],
    onEnd: (() => void)[]
  } = {
    onStart: [],
    onEnd: []
  }
  public STATES = COMMAND_STATE;
  public ELEMENT_NOT_FOUND_ERROR = 'element could not be found';

  public get options() {
    return Options;
  }

  public set options(options) {
    this.interval = options.interval || Options.interval;
    this.waitForCheckInterval = options.waitForCheckInterval || Options.waitForCheckInterval;
  }

  public callWhenReady(callback) {
    this.timeout = setTimeout(callback, this.interval);
  }

  public findElement(locator, parent) {
    var element = find(locator, parent || document.documentElement);
    if (!element) {
      throw new Error(this.ELEMENT_NOT_FOUND_ERROR);
    }
    return element;
  }

  public findElements(locator, parent) {
    return findAll(locator, parent || document.documentElement);
  }

  public assertValue(input, value) {
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
  }

  public onBeforeExecute(commands: RunnerCommand[], index: number, callback: (shouldContinue: boolean) => void) {
    callback(!commands[index].$skip);
  }

  public onAfterExecute(commands: RunnerCommand[], index: number, state: COMMAND_STATE, message: string, callback: () => void) {
    callback();
  }

  public onStart(commands: RunnerCommand[], index: number, count: number, callback: (shouldRun: boolean) => void) {
    let args = arguments;
    this.listeners.onStart.forEach((fn) => {
      fn.apply(this, args);
    });
    callback(true);
  }

  public onEnd(commands, index, count) {
    let args = arguments;
    this.listeners.onEnd.forEach((fn) => {
      fn.apply(this, args);
    });
  }

  // borrowed from Selenium ide fork: https://github.com/FDIM/selenium/commit/2dbb4f2764c1e3d6f1c7c74bdbe9f896aaefafe8
  public injectVariables(str) {
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
      var defaultValue;
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
  }
  // helper method to flat out an object to variables
  public exposeObjectAsVariables(object, prefix) {
    if (!prefix) {
      prefix = 'config';
    }
    Object.keys(object).forEach((key) => {
      var value = object[key];
      if (typeof (value) === 'object') {
        this.exposeObjectAsVariables(value, prefix + '.' + key);
      } else {
        this.variables[prefix + '.' + key] = value;
      }
    });
  }

  public start(commands, index, count, changeCallback) {
    this.stop();

    if (!index) {
      index = 0;
    }
    if (!count) {
      count = commands.length - index;
    }

    var self = this, steps = 0;
    this.onStart(commands, index, count, (shouldRun) => {
      if (shouldRun) {
        step(index);
      }
    });


    function step(index) {
      if (commands[index].type === 'comment') {
        self.callWhenReady(step.bind(this, index + 1));
      } else {
        self.onBeforeExecute(commands, index, function (shouldContinue) {
          steps++;
          if (shouldContinue) {
            self.execute(commands, index, (index, state, message) => {
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

    function done(index: number, state?: COMMAND_STATE) {
      if (state !== self.STATES.INPROGRESS && steps < count && index + 1 < commands.length) {
        self.callWhenReady(step.bind(this, index + 1));
      } else if (state !== self.STATES.INPROGRESS && steps === count) {
        self.onEnd(commands, index, count);
      }
    }

  }

  public stop() {
    clearTimeout(this.timeout);
    clearTimeout(this.waitForTimeout);
  }

  public execute(commands, index, changeCallback) {
    var command = commands[index];
    changeCallback(index, COMMAND_STATE.INPROGRESS);

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
            changeCallback(index, COMMAND_STATE.FAILED, accessorName + ' accessor: ' + (err.message || ''))
            return;
          }
          cmd = this.commands[prefix];
        }
      }
    }

    if (typeof (cmd) === 'function' && (!cmd.requiresAccessor || command.accessor)) {
      try {
        if (cmd.length > 2) { // uses commands list, an index and callback
          cmd.call(this, commands, index, (state, message) => {
            changeCallback(index, state, message);
          });
        } else if (cmd.length > 1) { // uses callback
          cmd.call(this, command, (state, message) => {
            changeCallback(index, state, message);
          });
        } else {
          cmd.call(this, command);
          changeCallback(index, COMMAND_STATE.DONE);
        }
      } catch (err) {
        changeCallback(index, COMMAND_STATE.FAILED, err.message || "an error occured");
      }
    } else {
      changeCallback(index, COMMAND_STATE.FAILED, "unknown command");
    }
  }

  public getSupportedCommands(): SupportedCommand[] {
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
  }
  // extra methods defined in other files
  public simulateKeyInput: (target: any, char: any) => void;
  public createKeyEvent: (type: any, options: any) => KeyboardEvent;
  public createMouseEvent: (type: any, options: any) => MouseEvent;
  public fireMouseEvent: (type: any, button: any, command: any) => void;
  public propertyAccessor: (property: any, command: any) => any;
}

export interface SupportedCommand {
  value: string;
  title: string
}

export interface RunnableCommand {
  (command: RunnerCommand, callback?: (state: COMMAND_STATE, message?: string) => void),
  requiresAccessor?: boolean
}

export class RunnerCommand extends TestCaseItem {
  public $skip?: boolean;
  public input?: boolean;
  public accessor: (command: RunnerCommand) => any
}

export const runner = new Runner();