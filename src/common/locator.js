module.exports = {
  css: CssLocator
};

function CssLocator(target) {
  var element = target, result = [];

  while (element.tagName !== 'BODY') {
    // go through known attributes (in order) and create css selector
    for (var i = 0; i < CssLocator.attributes.length; i++) {
      var attr = CssLocator.attributes[i], value, prefix = '', suffix = '';
      // take as is
      if (typeof (attr) === 'string') {
        value = element.getAttribute(attr);
        prefix = element.tagName.toLowerCase() + '[' + attr + '="';
        suffix = '"]';
        if (value) {
          value = value.replace(/"/g, '\"');
        }
      } else if (typeof (attr) === 'object') {
        value = element.getAttribute(attr.name);
        if (value && attr.format) {
          value = attr.format(value);
        }
        prefix = attr.prefix || '';
        suffix = attr.suffix || '';
      }

      if (value) {
        result.unshift(prefix + value + suffix);
        break;
      }
    }

    element = element.parentNode;
  }
  return 'css=' + result.join(' ');
}

CssLocator.classBlacklist = ['ng-scope'];
CssLocator.attributes = [
  {
    name: 'id',
    format: (v) => /^\d/.test(v) ? '[id="' + v + '"]' : '#' + v
  },
  'name',
  {
    name: 'class',
    prefix: '.',
    format: (v) => v.split(' ').filter((c) => CssLocator.classBlacklist.indexOf(c) === -1).join('.')
  },
  'type',
  'alt',
  'title',
  'value'
];
