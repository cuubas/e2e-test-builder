var elementHelper = require('./element-helper');
var STATES = require('./runner-states');

function Runner() {
  this.accessors = [];
  this.interval = 500;
  this.timeout = undefined;
}

Runner.prototype.callWhenReady = function (callback) {
  this.timeout = setTimeout(callback, this.interval);
};

Runner.prototype.onBeforeExecute = function (commands, index, callback) {
  callback();
};

Runner.prototype.onAfterExecute = function (commands, index, state, message, callback) {
  callback();
};

Runner.prototype.start = function (commands, index, count, changeCallback) {
  this.stop();
  
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
      self.onBeforeExecute(commands, index, function () {
        steps++;
        self.execute(commands[index], index, (index, state, message) => {
          changeCallback(index, state, message);

          self.onAfterExecute(commands, index, state, message, function () {
            if ((state === STATES.DONE || state === STATES.FAILED) && steps < count && index + 1 < commands.length) {
              self.callWhenReady(step.bind(this, index + 1));
            }
          });
        });
      });
    }
  }

};

Runner.prototype.stop = function () {
  clearTimeout(this.timeout);
};

Runner.prototype.execute = function (command, index, changeCallback) {
  changeCallback(index, STATES.INPROGRESS);

  setTimeout(() => {
    var element = elementHelper.find(command.locator, document);
    if (element && command.command === 'click') {
      element.click();
      changeCallback(index, STATES.DONE);
      return;
    }
    changeCallback(index, STATES.FAILED, 'unknown command or invalid locator');
  }, 2000);
}

module.exports = new Runner();