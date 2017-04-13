var locators = require("./locators");

module.exports = {
  find: find,
  highlight: highlight
};

function find(locator, parent) {
  var index = locator && locator.indexOf('=');
  if (index) {
    try {
      return locators[locator.substr(0, index)].find(locator.substr(index + 1), parent);
    } catch (er) {
      console.error(er);
    }
  }
  return null;
}

function highlight(element) {
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
  };

  element.scrollIntoViewIfNeeded();
  element.style.transition = "background-color 0.3s ease-in";
  element.style.backgroundColor = '#ffe004';

  element.addEventListener('transitionend', restore1);
  
}