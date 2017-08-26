import { SupportedLocators } from './locators';

export function findAll(locator: string, parent: HTMLElement | Document) {
  const index = locator && locator.indexOf('=');
  if (index) {
    try {
      const type = locator.substr(0, index);
      const selector = locator.substr(index + 1).replace(/(.*)@[^/\\'"><\]\[]*$/, '$1'); // remove anything after @ as it may be used to specify attribute name
      return SupportedLocators[type] && SupportedLocators[type].find(selector, parent);
    } catch (er) {
      console.error(er);
    }
  }
  return null;
}

export function find(locator: string, parent: HTMLElement | Document) {
  const list = findAll(locator, parent) || [];
  return list[0];
}

export function findLocators(target: HTMLElement, settings) {
  const types = (settings.locators || '').split(/\s|,/);
  return types.map((type) => {
    if (type && SupportedLocators[type]) {
      return SupportedLocators[type].create(target, settings);
    } else {
      console.info('unknown locator %s, must be one of %s', type, Object.keys(SupportedLocators).join(','));
    }
    return undefined;
  }).filter((value) => !!value);
}

export function highlight(element: HTMLElement, color?: string) {
  // ignore if element is highlighted now
  if (element.dataset._highlighted === '1') {
    return;
  }

  element.dataset._highlighted = '1';
  const backgroundColor = element.style.backgroundColor;
  const transition = element.style.transition;

  const restore1 = function () {
    element.style.backgroundColor = backgroundColor;
    element.removeEventListener('transitionend', restore1);
    element.addEventListener('transitionend', restore2);
  };

  const restore2 = function () {
    element.style.transition = transition;
    element.removeEventListener('transitionend', restore2);
    delete element.dataset._highlighted;
  };

  (<any>element).scrollIntoViewIfNeeded(); // this is chrome specific
  element.style.transition = 'background-color 0.3s ease-in';
  element.style.backgroundColor = color || '#ffe004';

  element.addEventListener('transitionend', restore1);

}
