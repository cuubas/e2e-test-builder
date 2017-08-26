
export class CssLocator {
  public classBlacklist = [/^ng\-/];
  public attributes = [
    {
      name: 'id',
      format: (v: string) => /^\d/.test(v) ? '[id="' + v + '"]' : '#' + v,
      interrupt: true
    },
    'name',
    {
      name: 'class',
      prefix: '.',
      format: (v: string, element: Element) => v.split(/\s+/).filter((c) => c && !this.classBlacklist.some((regex) => regex.test(c))).join('.')
    },
    'type',
    'alt',
    'title',
    'value',
    'tagName'
  ];

  public create(target: Element, settings: any): string {
    let element = target, interrupt = false;
    const result = [];

    while (element !== document.documentElement) {
      // go through known attributes (in order) and create css selector
      for (let i = 0; i < this.attributes.length; i++) {
        const attr = this.attributes[i] as any;
        let value, prefix = '', suffix = '', index;
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
          index = Array.prototype.indexOf.call(element.parentElement.children, element);
          if (index > 0 && element.parentElement.querySelectorAll(prefix + value + suffix).length > 1) {
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
      element = element.parentElement;
    }
    if (result.length > 0) {
      return 'css=' + result.join(' ');
    }


  }


  public find(locator: string, parent: Element): Element[] {
    locator = locator.trim();
    if (!locator) {
      return undefined;
    }
    const containsStartIndex = locator.indexOf(':contains(');
    const containsEndIndex = locator.indexOf(')', containsStartIndex);
    let result = [];
    let item;
    if (containsStartIndex !== -1 && containsEndIndex !== -1) {
      const prefix = locator.substring(0, containsStartIndex);
      const text = locator.substring(containsStartIndex + ':contains('.length + 1, containsEndIndex - 1).toLowerCase();
      const suffix = locator.substring(containsEndIndex + 1).trim();
      const items = prefix ? parent.querySelectorAll(prefix) : [parent];
      for (let i = 0, len = items.length; i < len; i++) {
        item = items[i];
        if (item.textContent.toLowerCase().indexOf(text) !== -1) {
          if (suffix) {
            this.find(suffix, item).forEach((it) => {
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
  }
}
