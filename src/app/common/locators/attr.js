module.exports = CustomAttributeLocator;

function CustomAttributeLocator(target, settings) {
  var element = target, result = [];

  while (element !== document.documentElement) {
    var value = element.getAttribute(settings.customAttribute);
    if (value) {
      var index,
        prefix = '[' + settings.customAttribute + '="',
        suffix = '"]';
      // get element index
      index = Array.prototype.indexOf.call(element.parentNode.children, element);
      if (index > 0 && element.parentNode.querySelectorAll(prefix + value + suffix).length > 1) {
        suffix += ':nth-child(' + (index + 1) + ')';
      }
      result.unshift(prefix + value.replace(/"/g, '\"') + suffix);
    }
    element = element.parentNode;
  }
  if (result.length > 0) {
    // append whitelisted tag name in case target doesn't have custom attribute
    if (CustomAttributeLocator.tagsWhitelist.indexOf(target.tagName) !== -1 && !target.getAttribute(settings.customAttribute)) {
      result.push(target.tagName.toLowerCase());
    }
    return 'css=' + result.join(' ');
  }
}

CustomAttributeLocator.tagsWhitelist = ['INPUT', 'SELECT', 'TEXTAREA'];