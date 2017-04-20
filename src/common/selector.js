var elementHelper = require('./element-helper');

function Selector() {

}


Selector.prototype.start = function (locator, callback) {
  this.stop();

  this.tracker = function (ev) {
    elementHelper.highlight(ev.target);
  };

  this.handler = function (ev) {
    ev.preventDefault();
    ev.stopPropagation();
    ev.stopImmediatePropagation();
    callback(ev.target);
    return false;
  };

  document.body.addEventListener('mousemove', this.tracker, true);
  document.body.addEventListener('click', this.handler, true);
};

Selector.prototype.stop = function () {
  document.body.removeEventListener('mousemove', this.tracker, true);
  document.body.removeEventListener('click', this.handler, true);
  this.handler = undefined;
  this.tracker = undefined;
};

module.exports = new Selector();