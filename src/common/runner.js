var elementHelper = require('./element-helper');
var STATES = require('./runner-states');

function Runner() {
  this.accessors = [];
  this.interval = 500;
}

Runner.prototype.execute = function (commands, index, count, changeCallback) {

  changeCallback(index, STATES.INPROGRESS);

  setTimeout(() => {
    if (commands && commands.length) {
      var item = commands[0];
      var element = elementHelper.find(item.locator, document);
      if (element && item.command === 'click') {
        element.click();
        changeCallback(index, STATES.DONE);
        return;
      }
    }
    changeCallback(index, STATES.FAILED);
  }, 2000);
};

module.exports = new Runner();