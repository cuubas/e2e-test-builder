import { get as locator } from './locators';

export const accessors = {} as any;

export function register(type, fn, valueType?, isMulti?, inBrowserContext?, global?) {
    accessors[type] = fn;
    fn.valueType = valueType || 'string';
    fn.isMulti = isMulti;
    fn.inBrowserContext = inBrowserContext;
    fn.isGlobal = global;
}

export function get(type, formatter?) {
    const fn = accessors[type && type.toLowerCase()] || accessors['default'];
    if (arguments.length === 2) {
        return fn(type, formatter);
    } else {
        return fn;
    }
}

export function format(type, cmd, formatter, output) {
    const getter = get(type);
    // special case for attribute accessor
    if (type === 'attribute') {
        const parts = cmd.locator.split('@');
        type = parts.pop();
        cmd.locator = parts.join('@');
    }
    if (getter.isGlobal) {
        output.push('browser' + getter(cmd.locator, formatter) + '.then(function (_value) {' + formatter.endOfLine);
    } else if (getter.inBrowserContext && !cmd.locator) {
        // executeAsyncScript passes callback as last argument, thus arguments[arguments.length - 1]
        // tslint:disable-next-line:max-line-length
        output.push(`browser.executeAsyncScript('arguments[arguments.length - 1](document.documentElement` + getter(type, formatter) + ` || document.body` + getter(type, formatter) + `)')` + `.then(function (_value) {` + formatter.endOfLine);
    } else if (getter.inBrowserContext) {
        // executeAsyncScript passes callback as last argument, thus arguments[arguments.length - 1]
        // tslint:disable-next-line:max-line-length
        output.push(`browser.executeAsyncScript('arguments[arguments.length - 1](arguments[0]` + getter(type, formatter) + `)', ` + locator(cmd.locator, formatter) + `.getWebElement())` + `.then(function (_value) {` + formatter.endOfLine);
    } else {
        output.push(locator(cmd.locator, formatter, getter.isMulti) + getter(type, formatter) + `.then(function (_value) {` + formatter.endOfLine);
    }
    return getter;
}

register('default', (value, formatter) => {
    return value ? '.getAttribute("' + value + '")' : '';
});

register('attribute', (value, formatter) => {
    return value ? '.getAttribute("' + value + '")' : '';
});

register('value', (value, formatter) => {
    return '.getAttribute("value")';
});

register('text', (value, formatter) => {
    return '.getText()';
});

register('elementwidth', (value, formatter) => {
    return '.getSize().then(function (s){return s.width;})';
}, 'number');

register('elementheight', (value, formatter) => {
    return '.getSize().then(function (s){return s.height;})';
}, 'number');

register('elementpositionleft', (value, formatter) => {
    return '.getLocation().then(function (l){return l.x;})';
}, 'number');

register('elementpositiontop', (value, formatter) => {
    return '.getLocation().then(function (l){return l.y;})';
}, 'number');

register('elementheight', (value, formatter) => {
    return '.getSize().then(function (s){return s.height;})';
}, 'number');

register('elementpresent', (value, formatter) => {
    return '.isPresent()';
}, 'boolean');

register('visible', (value, formatter) => {
    return '.isDisplayed()';
}, 'boolean');

register('elementenabled', (value, formatter) => {
    return '.isEnabled()';
}, 'boolean');

register('elementselected', (value, formatter) => {
    return '.isSelected()';
}, 'boolean');

register('elementcount', (value, formatter) => {
    return '.count()';
}, 'number', true);

register('csscount', (value, formatter) => {
    return '.count()';
}, 'number', true);

// 'native' properties
['scrollTop', 'scrollLeft'].forEach((prop) => {
    register(prop.toLowerCase(), (value, formatter) => {
        return '.' + prop;
    }, 'number', false, true);
});

register('location', (value, formatter) => {
    return '.getCurrentUrl()';
}, 'string', false, false, true);

register('title', (value, formatter) => {
    return '.getTitle()';
}, 'string', false, false, true);

register('eval', (value, formatter) => {
    return '.executeAsyncScript(\'arguments[arguments.length - 1](\' + ' + formatter.quote(value, true) + ' + \')\')';
}, 'string', false, false, true);
