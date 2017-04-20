module.exports = CssLocator;

function CssLocator(target) {
  var element = target, result = [], interrupt = false;

  while (element.tagName !== 'BODY') {
    // go through known attributes (in order) and create css selector
    for (var i = 0; i < CssLocator.attributes.length; i++) {
      var attr = CssLocator.attributes[i], value, prefix = '', suffix = '', index;
      // take as is
      if (attr === 'tagName') {
        value = element.tagName.toLowerCase();
      } else if (typeof (attr) === 'string') {
        value = element.getAttribute(attr);
        prefix = element.tagName.toLowerCase() + '[' + attr + '="';
        suffix = '"]';
        if (value) {
          value = value.replace(/"/g, '\"');
        }
      } else if (typeof (attr) === 'object') {
        value = element.getAttribute(attr.name);
        if (value && attr.format) {
          value = attr.format(value, element);
        }
        prefix = attr.prefix || '';
        suffix = attr.suffix || '';
      }

      if (value) {
        // get element index
        index = Array.prototype.indexOf.call(element.parentNode.children, element);
        if (index > 0 && element.parentNode.querySelectorAll(prefix + value + suffix).length > 1) {
          suffix += ':nth-child(' + (index + 1) + ')';
        }

        result.unshift(prefix + value + suffix);
        interrupt = attr.interrupt === true; // interrupt generation if it is significant enough
        break;
      }
    }
    if (interrupt) {
      break;
    }
    element = element.parentNode;
  }
  return 'css=' + result.join(' ');
}

CssLocator.classBlacklist = [/^ng\-/];
CssLocator.attributes = [
  {
    name: 'id',
    format: (v) => /^\d/.test(v) ? '[id="' + v + '"]' : '#' + v,
    interrupt: true
  },
  'name',
  {
    name: 'class',
    prefix: '.',
    format: (v, element) => v.split(' ').filter((c) => !CssLocator.classBlacklist.some((regex) => regex.test(c))).join('.')
  },
  'type',
  'alt',
  'title',
  'value',
  'tagName'
];

CssLocator.find = function (locator, parent) {
  locator = locator.trim();
  if (!locator) {
    return undefined;
  }
  var containsStartIndex = locator.indexOf(':contains(');
  var containsEndIndex = locator.indexOf(')', containsStartIndex);
  var result, item;
  if (containsStartIndex !== -1 && containsEndIndex !== -1) {
    var prefix = locator.substring(0, containsStartIndex);
    var text = locator.substring(containsStartIndex + ":contains(".length + 1, containsEndIndex - 1).toLowerCase();
    var suffix = locator.substring(containsEndIndex + 1).trim();
    var items = parent.querySelectorAll(prefix);
    for (var i = 0, len = items.length; i < len; i++) {
      item = items[i];
      if (item.textContent.toLowerCase().indexOf(text) !== -1) {
        if (suffix) {
          result = CssLocator.find(suffix, item);
          if (result) {
            break;
          }
        } else {
          result = item;
          break;
        }
      }
    }
  } else {
    result = parent.querySelector(locator);
  }
  return result;
};