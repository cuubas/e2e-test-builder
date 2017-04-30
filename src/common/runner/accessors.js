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

runner.accessors.location = function (command) {
  return document.location;
};

runner.accessors.title = function (command) {
  return document.title;
};
runner.accessors.cookie = function (command) {
  return document.cookie;
};
runner.accessors.cookiePresent = function (command) {
  return document.cookie.indexOf(command.locator + '=') !== -1;
};
runner.accessors.cookieByName = function (command) {
  var cookies = {};
  document.cookie.split(';').forEach((c) => {
    var parts = c.split('=');
    cookies[parts.shift().trim()] = parts.join('=');
  });

  return cookies[command.locator];
};
runner.accessors.cursorPosition = function (command) {
  var el = this.findElement(command.locator);
  if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
    return el.selectionStart;
  }
  throw new Error("not an input element");
};
runner.accessors.editable = function (command) {
  var el = this.findElement(command.locator);
  if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
    return !el.disabled && !el.readOnly;
  }
  throw new Error("not an input element");
};
runner.accessors.cssCount = function (command) {
  return this.findElements(command.locator).length;
};

runner.accessors.elementHeight = runner.propertyAccessor.bind(runner, 'clientHeight');
runner.accessors.elementWidth = runner.propertyAccessor.bind(runner, 'clientWidth');
runner.accessors.elementPositionTop = function (command) {
  return this.findElement(command.locator).getBoundingClientRect().top;
};
runner.accessors.elementPositionLeft = function (command) {
  return this.findElement(command.locator).getBoundingClientRect().left;
};
runner.accessors.elementIndex = function (command) {
  var el = this.findElement(command.locator);
  return Array.prototype.indexOf.call(el.parentNode.children, el);
};
runner.accessors.elementPresent = function (command) {
  try {
    return !!this.findElement(command.locator);
  } catch (err) {
    if (err.message === runner.ELEMENT_NOT_FOUND_ERROR) {
      return false;
    } else {
      throw err;
    }
  }
};
runner.accessors.visible = function (command) {
  var el;
  try {
    el = this.findElement(command.locator);
  } catch (err) {
    if (err.message === runner.ELEMENT_NOT_FOUND_ERROR) {
      el = false;
    } else {
      throw err;
    }
  }
  return el && el.offsetParent !== null && window.getComputedStyle(el).visibility === 'visible';
};

runner.accessors.selectedIndex = runner.propertyAccessor.bind(runner, 'selectedIndex');
runner.accessors.selectedValue = runner.propertyAccessor.bind(runner, 'selectedValue');
runner.accessors.selectedLabel = function (command) {
  return this.findElement(command.locator).selectedOptions.item(0).textContent;
};