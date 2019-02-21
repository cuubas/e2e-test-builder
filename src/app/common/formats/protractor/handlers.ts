// tslint:disable:max-line-length
import { get as locator } from './locators';
import { format as accessorFormat } from './accessors';

export const handlers = {} as any;

export function register(type, fn, scoped?: boolean, closeBlockBefore?: boolean) {
    handlers[type] = fn;
    fn.type = type;
    fn.scoped = scoped;
    fn.closeBlockBefore = closeBlockBefore;
}

export function toMatchParam(formatter, expr, modifiers?) {
    if (expr.indexOf('/') === 0) {
        return expr;
    } else {
        return 'new RegExp(' + formatter.quote(expr, true) + (modifiers ? `,'` + modifiers + `'` : '') + `)`;
    }
}

export function expectation(value, valueType, formatter, message, negate?: boolean) {
    let res = '';
    if (!value) {
        value = '';
    }
    // negate
    if (value.indexOf('!') === 0) {
        value = value.substring(1);
        res += 'not.';
    }
    // negate
    if (negate) {
        res += 'not.';
    }
    if (valueType === 'boolean') {
        res += 'toBe(';
        if (value === '') {
            res += 'true';
        } else if (/true|false/.test(value)) {
            res += value;
        } else {
            res += formatter.expression(value);
        }
        res += ',' + formatter.quote(message, true) + ');';
    } else if (value.indexOf('regexp:') === 0) {
        res += 'toMatch(' + toMatchParam(formatter, value.substring(7)) + ',' + formatter.quote(message, true) + ');';
    } else if (value.indexOf('regexpi:') === 0) {
        res += 'toMatch(' + toMatchParam(formatter, value.substring(8), 'i') + ',' + formatter.quote(message, true) + ');';
    } else {
        let matcher = 'toEqual(';
        if (value.indexOf('<') === 0) {
            matcher = 'toBeLessThan(';
            value = value.substring(1);
        } else if (value.indexOf('>') === 0) {
            matcher = 'toBeGreaterThan(';
            value = value.substring(1);
        }
        res += matcher + (valueType === 'number' && formatter.numberLikeRegex.test(value) ? value : formatter.expression(value, true)) + ',' + formatter.quote(message, true) + ');';
    }
    return res;
}

function replaceKeyConstants(input) {
    // TODO: handle all supported keys
    return input.replace(/KEY_ENTER/g, 'protractor.Key.Enter');
}

// supported handlers
register('default', (cmd, formatter) => {
    if (cmd.type) {
        console.error('command "' + cmd.type + '" is not supported');
        return 'fail(' + formatter.quote('command ' + cmd.type + ' is not supported') + ');' + formatter.endOfLine;
    } else {
        return formatter.endOfLine;
    }
});

register('defaultassert', (cmd, formatter) => {
    const negate = cmd.type.indexOf('assertNot') === 0;
    const length = negate ? 'assertnot'.length : 'assert'.length;
    const type = cmd.type.substring(length, length + 1).toLowerCase() + cmd.type.substring(length + 1);
    const res = [];
    const accessor = accessorFormat(type, cmd, formatter, res);
    res.push(formatter.whitespace + 'expect(_value).' + expectation(cmd.value, accessor.valueType, formatter, formatter.stringifyCommand(cmd), negate) + formatter.endOfLine);
    return res;
}, true);

register('defaultverify', (cmd, formatter) => {
    // pass through
    return handlers['default'](cmd, formatter);
});

register('defaultstore', (cmd, formatter) => {
    const length = 'store'.length;
    const type = cmd.type.substring(length, length + 1).toLowerCase() + cmd.type.substring(length + 1);
    const res = [];
    const accessor = accessorFormat(type, cmd, formatter, res);

    res.push(formatter.whitespace + cmd.value + ' = _value;' + formatter.endOfLine);

    return res;
}, true);

register('defaultecho', (cmd, formatter) => {
    const length = 'echo'.length;
    const type = cmd.type.substring(length, length + 1).toLowerCase() + cmd.type.substring(length + 1);
    const res = [];
    const accessor = accessorFormat(type, cmd, formatter, res);

    res.push(formatter.whitespace + 'console.info(_value);' + formatter.endOfLine);

    return res;
}, true);

register('store', (cmd, formatter) => {
    let value;
    if (formatter.validLocatorRegex.test(cmd.locator)) { // must have selector prefix
        value = locator(cmd.locator, formatter);
    } else {
        value = formatter.expression(cmd.locator);
    }
    return cmd.value + ' = ' + value + ';' + formatter.endOfLine;
});

register('assert', (cmd, formatter) => {
    return 'expect(' + formatter.expression(cmd.locator) + ').' + expectation(cmd.value, formatter.numberLikeRegex.test(cmd.value) ? 'number' : 'string', formatter, formatter.stringifyCommand(cmd), false) + formatter.endOfLine;
});

register('assertnot', (cmd, formatter) => {
    return 'expect(' + formatter.expression(cmd.locator) + ').' + expectation(cmd.value, formatter.numberLikeRegex.test(cmd.value) ? 'number' : 'string', formatter, formatter.stringifyCommand(cmd), true) + formatter.endOfLine;
});

['alert', 'confirmation', 'prompt'].forEach((type) => {

    register('assert' + type, (cmd, formatter) => {
        return [
            'expect(browser.switchTo().alert().getText()).' + expectation(cmd.locator || cmd.value, 'string', formatter, formatter.stringifyCommand(cmd)) + formatter.endOfLine,
            'browser.switchTo().alert().accept();' + formatter.endOfLine

        ];
    });
    register('assertnot' + type, (cmd, formatter) => {
        return [
            'expect(browser.switchTo().alert().getText()).' + expectation(cmd.locator || cmd.value, 'string', formatter, formatter.stringifyCommand(cmd), true) + formatter.endOfLine,
            'browser.switchTo().alert().accept();' + formatter.endOfLine

        ];
    });

    register('store' + type, (cmd, formatter) => {
        return [
            'browser.switchTo().alert().getText().then((_value) => {' + formatter.endOfLine,
            formatter.whitespace + cmd.value + ' = _value;' + formatter.endOfLine,
            formatter.whitespace + 'browser.switchTo().alert().accept();' + formatter.endOfLine
        ];
    }, true);
});

register('it', (cmd, formatter) => {
    return (cmd.skip ? 'xit' : 'it') + '(' + formatter.quote(cmd.value) + ', () => {' + formatter.endOfLine.repeat(2);
}, true, true);

register('desc', (cmd, formatter) => {
    return (cmd.skip ? 'xdescribe' : 'describe') + '(' + formatter.quote(cmd.value) + ', () => {' + formatter.endOfLine.repeat(2);
}, true);

register('export', (cmd, formatter) => {
    return 'module.exports = ((config, data) => {' + formatter.endOfLine.repeat(2);
}, true);

register('breakif', (cmd, formatter) => {
    return [
        'if (' + (cmd.locator ? formatter.expression(cmd.locator) : '') + cmd.value + ') {' + formatter.endOfLine,
        formatter.whitespace + 'return;' + formatter.endOfLine,
        '}' + formatter.endOfLine
    ];
});

register('continueif', (cmd, formatter) => {
    return [
        'if (!(' + (cmd.locator ? formatter.expression(cmd.locator) : '') + cmd.value + ')) {' + formatter.endOfLine,
        formatter.whitespace + 'return;' + formatter.endOfLine,
        '}' + formatter.endOfLine
    ];
});

register('callback', (cmd, formatter) => {
    let fn = cmd.value;
    const hasBracket = fn.indexOf('(') !== -1;
    if (hasBracket) {
        fn = fn.substring(0, fn.indexOf('('));
    }
    const result = [
        'if (typeof ' + fn + ' === "function") {' + formatter.endOfLine,
        formatter.whitespace + cmd.value + (hasBracket ? ';' : '();') + formatter.endOfLine,
        '} else {' + formatter.endOfLine,
        formatter.whitespace + 'console.info("' + fn + ' is not a function");' + formatter.endOfLine,
        '}' + formatter.endOfLine
    ];
    // special case as this code is put outside of `it` block
    if (cmd.skip) {
        result.unshift('/* callback is intentionally skipped' + formatter.endOfLine);
        result.push('*/' + formatter.endOfLine);
    }
    return result;
}, false, true);

register('click', (cmd, formatter) => {
    return [
        handlers['focus'](cmd, formatter),
        locator(cmd.locator, formatter) + '.click().then(null, (err) => fail(err + "\\ncommand: " + ' + formatter.quote(formatter.stringifyCommand(cmd), true) + '));' + formatter.endOfLine.repeat(2)
    ];
});
function mouseAction(type, button, withOffset, cmd, formatter) {
    let offset = '';
    if (cmd.value && withOffset) {
        const coords = cmd.value.split(',');
        if (coords.length === 2) {
            offset = ', { x: ' + coords[0] + ', y: ' + coords[1] + ' }';
        }
    }
    return [
        handlers['focus'](cmd, formatter),
        'browser.actions().mouseMove(' + locator(cmd.locator, formatter) + offset + ').' + type + '(' + button + ').perform().then(null, (err) => fail(err + "\\ncommand: " + ' + formatter.quote(formatter.stringifyCommand(cmd), true) + '));' + formatter.endOfLine.repeat(2)
    ];
}
register('mousedown', mouseAction.bind(this, 'mouseDown', 0, false));
register('mousedownat', mouseAction.bind(this, 'mouseDown', 0, true));
register('mousedownright', mouseAction.bind(this, 'mouseDown', 2, false));
register('mousedownrightat', mouseAction.bind(this, 'mouseDown', 2, true));
register('mouseup', mouseAction.bind(this, 'mouseUp', 0, false));
register('mouseupat', mouseAction.bind(this, 'mouseUp', 0, true));
register('mouseupright', mouseAction.bind(this, 'mouseUp', 2, false));
register('mouseuprightat', mouseAction.bind(this, 'mouseUp', 2, true));

register('enablesynchronization', (cmd, formatter) => {
    return 'browser.ignoreSynchronization = false;' + formatter.endOfLine;
});

register('disablesynchronization', (cmd, formatter) => {
    return 'browser.ignoreSynchronization = true;' + formatter.endOfLine;
});

register('pause', (cmd, formatter) => {
    return 'browser.pause();' + formatter.endOfLine;
});

register('refresh', (cmd, formatter) => {
    return 'browser.refresh();' + formatter.endOfLine;
});

register('echo', (cmd, formatter) => {
    return 'console.info(' + formatter.quote(cmd.value || cmd.locator, true) + ');' + formatter.endOfLine;
});

register('submit', (cmd, formatter) => {
    return [
        locator(cmd.locator, formatter) + '.submit();' + formatter.endOfLine.repeat(2)
    ];
});

register('clear', (cmd, formatter) => {
    return [
        locator(cmd.locator, formatter) + '.clear();' + formatter.endOfLine.repeat(2)
    ];
});

register('type', (cmd, formatter) => {
    // EMP-8465 is meant to refactor/extend this a bit
    return [
        locator(cmd.locator, formatter) + '.clear();' + formatter.endOfLine.repeat(2),
        locator(cmd.locator, formatter) + '.sendKeys(' + formatter.expression(replaceKeyConstants(cmd.value)) + ');' + formatter.endOfLine
    ];
});
register('sendkeys', (cmd, formatter) => {
    return [
        locator(cmd.locator, formatter) + '.sendKeys(' + formatter.expression(replaceKeyConstants(cmd.value)) + ');' + formatter.endOfLine
    ];
});

register('select', (cmd, formatter) => {
    let value = cmd.value;
    let optionSelector;
    if (value.indexOf('label=') === 0) {
        value = cmd.value.substring('label='.length);
    }
    if (value.indexOf('index=') === 0) {
        value = cmd.value.substring('index='.length);
        optionSelector = 'by.css(`option:nth-child(' + (parseInt(value, 10) + 1) + ')`)';
    } else if (value.indexOf('value=') === 0) {
        value = cmd.value.substring('value='.length);
        optionSelector = 'by.css(`option[value=\'' + value + '\']`)';
    } else if (value.indexOf('id=') === 0) {
        value = cmd.value.substring('id='.length);
        optionSelector = 'by.css(`option[id=\'' + value + '\']`)';
    } else {
        optionSelector = 'by.cssContainingText(\'option\',' + formatter.expression(value) + ')';
    }
    return locator(cmd.locator, formatter) + '.element(' + optionSelector + ').click();' + formatter.endOfLine;
});

register('selectframe', (cmd, formatter) => {
    const list = [];
    if (cmd.locator === 'relative=top' || !cmd.locator) {
        list.push('browser.switchTo().defaultContent().then(() => {' + formatter.endOfLine);
        list.push(formatter.whitespace + 'browser.ignoreSynchronization = false;' + formatter.endOfLine);
    } else {
        list.push('browser.ignoreSynchronization = true;' + formatter.endOfLine);
        list.push('browser.switchTo().frame(' + locator(cmd.locator, formatter) + '.getWebElement()).then(() => {' + formatter.endOfLine);
    }
    return list;
}, true);

register('open', (cmd, formatter) => {
    return 'browser.get(' + formatter.expression(cmd.locator || cmd.value) + ');' + formatter.endOfLine;
});

register('sleep', (cmd, formatter) => {
    return 'browser.sleep(' + (cmd.value * 1 || 1000) + ');' + formatter.endOfLine;
});

register('focus', (cmd, formatter) => {
    return 'browser.executeScript(\'arguments[0].scrollIntoView(false);\', ' + locator(cmd.locator, formatter) + '.getWebElement());' + formatter.endOfLine;
});

register('scrollto', (cmd, formatter) => {
    const values = cmd.value.split(',');
    let left, top;
    if (values.length === 1) {
        left = 0;
        top = values[0];
    } else {
        left = values[0];
        top = values[1];
    }
    if (cmd.locator) {
        return 'browser.executeScript(`arguments[0].scrollTop = ' + top + ';arguments[0].scrollLeft = ' + left + ';`, ' + locator(cmd.locator, formatter) + '.getWebElement());' + formatter.endOfLine;
    } else {
        return 'browser.executeScript(`document.documentElement.scrollTop = document.body.scrollTop = ' + top + ';document.documentElement.scrollLeft = document.body.scrollLeft = ' + left + ';`);' + formatter.endOfLine;
    }
});

register('scrollby', (cmd, formatter) => {
    const values = cmd.value.split(',');
    let left, top;
    if (values.length === 1) {
        left = 0;
        top = values[0];
    } else {
        left = values[0];
        top = values[1];
    }
    if (cmd.locator) {
        return 'browser.executeScript(`arguments[0].scrollTop += ' + top + ';arguments[0].scrollLeft += ' + left + ';`, ' + locator(cmd.locator, formatter) + '.getWebElement());' + formatter.endOfLine;
    } else {
        return 'browser.executeScript(`document.documentElement.scrollTop +=' + top + '; document.body.scrollTop += ' + top + ';document.documentElement.scrollLeft += ' + left + '; document.body.scrollLeft += ' + left + ';`);' + formatter.endOfLine;
    }
});

register('eval', (cmd, formatter) => {
    if (cmd.locator && formatter.validLocatorRegex.test(cmd.locator)) {
        const value = 'var element = arguments[0];' + cmd.value;
        return 'browser.executeScript(' + formatter.quote(value, true) + ',' + locator(cmd.locator, formatter) + '.getWebElement());' + formatter.endOfLine;
    } else {
        return 'browser.executeScript(' + formatter.quote(cmd.value || cmd.locator, true) + ');' + formatter.endOfLine;
    }
});

// TODO: should support more waitFor* commands
register('waitforelementpresent', (cmd, formatter) => {
    return 'browser.wait(protractor.ExpectedConditions.presenceOf(' + locator(cmd.locator, formatter) + '), ' + (cmd.value || 2000) + ',' + formatter.quote(formatter.stringifyCommand(cmd), true) + ');' + formatter.endOfLine;
});

register('waitforelementtobeclickable', (cmd, formatter) => {
    return "browser.wait(protractor.ExpectedConditions.elementToBeClickable(" + locator(cmd.locator, formatter) + "), " + (cmd.value || 2000) + "," + formatter.quote(formatter.stringifyCommand(cmd), true) + ");" + formatter.endOfLine;
});

register('waitfornotelementpresent', (cmd, formatter) => {
    return "browser.wait(protractor.ExpectedConditions.stalenessOf(" + locator(cmd.locator, formatter) + "), " + (cmd.value || 2000) + "," + formatter.quote(formatter.stringifyCommand(cmd), true) + ");" + formatter.endOfLine;
});

register('waitforvisible', (cmd, formatter) => {
    return 'browser.wait(protractor.ExpectedConditions.visibilityOf(' + locator(cmd.locator, formatter) + '), ' + (cmd.value || 2000) + ',' + formatter.quote(formatter.stringifyCommand(cmd), true) + ');' + formatter.endOfLine;
});

registerHandler('waitforcsscount', (cmd, formatter) => {
    return [
        "browser.wait(function() {" + formatter.endOfLine,
        formatter.whitespace + "return " + locator(cmd.locator, formatter, true) + '.count().then(function(_count) {' + formatter.endOfLine,
        formatter.indent(2) + "return " + formatter.comparisonExpression('${_count}', cmd.value) + ';' + formatter.endOfLine,
        formatter.whitespace + "});" + formatter.endOfLine,
        "}, 3000);" + formatter.endOfLine
    ];
});

register('waitfornotvisible', (cmd, formatter) => {
    return 'browser.wait(protractor.ExpectedConditions.invisibilityOf(' + locator(cmd.locator, formatter) + '), ' + (cmd.value || 2000) + ',' + formatter.quote(formatter.stringifyCommand(cmd), true) + ');' + formatter.endOfLine;
});

register('waitfortext', (cmd, formatter) => {
    return 'browser.wait(protractor.ExpectedConditions.textToBePresentInElement(' + locator(cmd.locator, formatter) + ',' + formatter.expression(cmd.value) + '), 5000, ' + formatter.quote(formatter.stringifyCommand(cmd), true) + ');' + formatter.endOfLine;
});

register('waitfornottext', (cmd, formatter) => {
    return 'browser.wait(protractor.ExpectedConditions.not(protractor.ExpectedConditions.textToBePresentInElement(' + locator(cmd.locator, formatter) + ',' + formatter.expression(cmd.value) + ')), 5000, ' + formatter.quote(formatter.stringifyCommand(cmd), true) + ');' + formatter.endOfLine;
});

register('waitforvalue', (cmd, formatter) => {
    return 'browser.wait(protractor.ExpectedConditions.textToBePresentInElementValue(' + locator(cmd.locator, formatter) + ',' + formatter.expression(cmd.value) + '), 5000, ' + formatter.quote(formatter.stringifyCommand(cmd), true) + ');' + formatter.endOfLine;
});

register('waitfornotvalue', (cmd, formatter) => {
    return 'browser.wait(protractor.ExpectedConditions.not(protractor.ExpectedConditions.textToBePresentInElementValue(' + locator(cmd.locator, formatter) + ',' + formatter.expression(cmd.value) + ')), 5000, ' + formatter.quote(formatter.stringifyCommand(cmd), true) + ');' + formatter.endOfLine;
});
