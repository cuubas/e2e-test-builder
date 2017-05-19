module.exports = CustomAttributeLocator;

function CustomAttributeLocator(target, settings) {
  var element = target, result = [];

  while (element.tagName !== 'BODY') {
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
    } else if (element === target && CustomAttributeLocator.tagsWhitelist.indexOf(target.tagName) !== -1) {
      result.push(target.tagName.toLowerCase());
    }
    element = element.parentNode;
  }
  if (result.length > 0) {
    return 'css=' + result.join(' ');
  }
}

CustomAttributeLocator.tagsWhitelist = ['INPUT', 'SELECT', 'TEXTAREA'];