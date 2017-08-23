module.exports = CssLocator;

function CssLocator(target, settings) {
  var element = target, result = [], interrupt = false;

  while (element !== document.documentElement) {
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
  if (result.length > 0) {
    return 'css=' + result.join(' ');
  }
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
    format: (v, element) => v.split(/\s+/).filter((c) => c && !CssLocator.classBlacklist.some((regex) => regex.test(c))).join('.')
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
  var result = [], item;
  if (containsStartIndex !== -1 && containsEndIndex !== -1) {
    var prefix = locator.substring(0, containsStartIndex);
    var text = locator.substring(containsStartIndex + ":contains(".length + 1, containsEndIndex - 1).toLowerCase();
    var suffix = locator.substring(containsEndIndex + 1).trim();
    var items = prefix ? parent.querySelectorAll(prefix) : [parent];
    for (var i = 0, len = items.length; i < len; i++) {
      item = items[i];
      if (item.textContent.toLowerCase().indexOf(text) !== -1) {
        if (suffix) {
          CssLocator.find(suffix, item).forEach((it) => {
            result.push(it);
          });
        } else {
          result.push(item);
        }
      }
    }
  } else {
    result = Array.prototype.slice.call(parent.querySelectorAll(locator));
  }
  return result;
};