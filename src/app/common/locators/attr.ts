export class AttrLocator {
  public tagsWhitelist = ['INPUT', 'SELECT', 'TEXTAREA'];

  public create(target: Element, settings: any): string {
    let element = target;
    const result = [];

    while (element !== document.documentElement) {
      const value = element.getAttribute(settings.customAttribute);
      if (value) {
        let index;
        const prefix = '[' + settings.customAttribute + '="';
        let suffix = '"]';
        // get element index
        index = Array.prototype.indexOf.call(element.parentNode.childNodes, element);
        if (index > 0 && element.parentElement.querySelectorAll(prefix + value + suffix).length > 1) {
          suffix += ':nth-child(' + (index + 1) + ')';
        }
        result.unshift(prefix + value.replace(/"/g, '\"') + suffix);
      }
      element = element.parentElement;
    }
    if (result.length > 0) {
      // append whitelisted tag name in case target doesn't have custom attribute
      if (this.tagsWhitelist.indexOf(target.tagName) !== -1 && !target.getAttribute(settings.customAttribute)) {
        result.push(target.tagName.toLowerCase());
      }
      return 'css=' + result.join(' ');
    }
  }

}
