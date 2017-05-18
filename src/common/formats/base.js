function BaseFormatter() {
  this.name = "unknown";
  this.extension = "unknown";
}

BaseFormatter.prototype.test = function (filename) {
  filename = filename || '';
  return filename.indexOf(this.extension) === filename.length - this.extension.length;
};

module.exports = BaseFormatter;