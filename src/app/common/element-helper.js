var locators = require("./locators");

module.exports = {
  find: find,
  findAll: findAll,
  locators: findLocators,
  highlight: highlight
};

function findAll(locator, parent) {
  var index = locator && locator.indexOf('=');
  if (index) {
    try {
      var type = locator.substr(0, index);
      var selector = locator.substr(index + 1).replace(/(.*)@[^/\\'"><\]\[]*$/,'$1'); // remove anything after @ as it may be used to specify attribute name
      return locators[type] && locators[type].find(selector, parent);
    } catch (er) {
      console.error(er);
    }
  }
  return null;
}

function find(locator, parent) {
  var list = findAll(locator, parent) || [];
  return list[0];
}

function findLocators(target, settings) {
  var types = (settings.locators || '').split(/\s|,/);
  return types.map((type) => {
    if (type && locators[type]) {
      return locators[type](target, settings);
    } else {
      console.info('unknown locator %s, must be one of %s', type, Object.keys(locators).join(','));
    }
    return undefined;
  }).filter((value) => !!value);
}

function highlight(element, color) {
  // ignore if element is highlighted now
  if (element.dataset._highlighted === '1') {
    return;
  }

  element.dataset._highlighted = '1';
  var backgroundColor = element.style.backgroundColor;
  var transition = element.style.transition;

  var restore1 = function () {
    element.style.backgroundColor = backgroundColor;
    element.removeEventListener('transitionend', restore1);
    element.addEventListener('transitionend', restore2);
  }

  var restore2 = function () {
    element.style.transition = transition;
    element.removeEventListener('transitionend', restore2);
    delete element.dataset._highlighted;
  };

  element.scrollIntoViewIfNeeded();
  element.style.transition = "background-color 0.3s ease-in";
  element.style.backgroundColor = color || '#ffe004';

  element.addEventListener('transitionend', restore1);

}