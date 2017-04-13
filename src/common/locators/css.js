module.exports = CssLocator;

function CssLocator(target) {
  var element = target, result = [];

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
          suffix +=':nth-child(' + (index + 1) + ')';
        }
        
        result.unshift(prefix + value + suffix);
        break;
      }
    }

    element = element.parentNode;
  }
  return 'css=' + result.join(' ');
}

CssLocator.classBlacklist = [/^ng\-/];
CssLocator.attributes = [
  {
    name: 'id',
    format: (v) => /^\d/.test(v) ? '[id="' + v + '"]' : '#' + v
  },
  'name',
  {
    name: 'class',
    prefix: '.',
    format: (v, element) => v.split(' ').filter((c) => !CssLocator.classBlacklist.some((regex)=>regex.test(c))).join('.')
  },
  'type',
  'alt',
  'title',
  'value',
  'tagName'
];

CssLocator.find = function(locator, parent) {
  return parent.querySelector(locator);
};