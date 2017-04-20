var runner = require('./../runner');

runner.accessors.attribute = function (command) {
  var index = command.locator.indexOf('@');
  if (index === -1) {
    throw new Error("attribute name not provided (value after @ in locator)");
  }
  var parts = command.locator.split('@');
  command.locator = parts.shift();
  var name = parts.join('');
  return this.findElement(command.locator).getAttribute(name);
};

runner.propertyAccessor = function (property, command) {
  return this.findElement(command.locator)[property];
};

runner.accessors.text = runner.propertyAccessor.bind(runner, 'textContent');
runner.accessors.value = runner.propertyAccessor.bind(runner, 'value');
runner.accessors.checked = runner.propertyAccessor.bind(runner, 'checked');
runner.accessors.scrollTop = runner.propertyAccessor.bind(runner, 'scrollTop');
runner.accessors.scrollLeft = runner.propertyAccessor.bind(runner, 'scrollLeft');

runner.accessors.eval = function (command) {
  return eval(command.locator);
};