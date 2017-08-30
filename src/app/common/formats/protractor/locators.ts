export const locators = {};

export function register(type, fn) {
    locators[type] = fn;
}

export function get(input, formatter, isMulti?: boolean) {
    let res;
    if (input.indexOf('$') === 0) {
        const end = input.indexOf('}');
        res = input.substring(2, end);
        if (end < input.length - 1) {
            input = input.substring(end + 1);
            // nested locators
            if (input.indexOf('>>') === 0) {
                input = input.substring(2);
            }
            res += '.' + get(input, formatter, isMulti);
        }
    } else if (input.indexOf('=') === -1 || input.indexOf('/') === 0) {
        res = locators['default'](input, formatter);
    } else {

        const splits = input.split('=');
        const type = splits.shift();
        res = (locators[type] || locators['default'])(splits.join('='), formatter);
    }
    if (isMulti) {
        res = res.replace(/element\(/g, 'element.all(');
        res = res.replace(/.element.all\(/g, '.all(');
    }
    return res;
}

// supported locators
register('default', (locator, formatter) => {
    return 'element(by.xpath(' + formatter.quote(locator, true) + '))';
});
register('xpath', (locator, formatter) => {
    return locators['default'].call(this, locator, formatter);
});
// standard selectors supported by protractor
// tslint:disable-next-line:max-line-length
['binding', 'exactBinding', 'model', 'buttonText', 'partialButtonText', 'repeater', 'exactRepeater', 'cssContainingText', 'deepCss', 'className', 'id', 'linkText', 'js', 'name', 'partialLinkText', 'tagName', 'xpath'].forEach((type) => {
    register(type, (locator, formatter) => {
        return 'element(by.' + type + '(' + formatter.quote(locator, true) + '))';
    });
});
register('css', (locator, formatter) => {
    const CONTAINS_START = /\:contains\(['"]/,
        CONTAINS_END = /["']\)/,
        CONTAINS_LENGTH = ':contains("'.length,
        containsStartIndex = locator.search(CONTAINS_START),
        containsEndIndex = locator.search(CONTAINS_END);
    let text,
        innerSelect,
        result;
    if (containsStartIndex !== -1 && containsEndIndex !== -1) {
        text = locator.trim().substring(containsStartIndex + CONTAINS_LENGTH, containsEndIndex);
        innerSelect = locator.substr(containsEndIndex + 2).trim();
        result = 'element(by.cssContainingText(' + formatter.quote(locator.substr(0, containsStartIndex), true) + ', ' + formatter.quote(text, true) + '))';
        if (innerSelect) {
            result += '.' + locators['css'](innerSelect, formatter);
        }
    } else {
        result = 'element(by.css(' + formatter.quote(locator, true) + '))';
    }
    return result;
});

// custom ones
register('click', (locator, formatter) => {
    return 'element(by.css(`[ng-click=' + formatter.quote(locator) + ']`))';
});
register('href', (locator, formatter) => {
    return 'element(by.css(`[href=' + formatter.quote(locator) + ']`))';
});
