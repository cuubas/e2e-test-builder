import { locators } from './locators';
import { handlers } from './handlers';

export function Formatter(options) {
    this.options = options || {};
    this.endOfLine = this.options.endOfLine || '\n';
    this.whitespace = this.options.whitespace || '  ';
    this.numberLikeRegex = /^[\d]+$|^[\d]+\.[\d]+$/;
    this.validLocatorRegex = /^[a-zA-Z0-9]+=/;
}

Formatter.prototype.indent = function (num) {
    return this.whitespace.repeat(num);
};

Formatter.prototype.stringifyCommand = function (cmd) {
    return cmd.type + '|' + cmd.locator + '|' + cmd.value;
};

Formatter.prototype.quote = function (v, withVariables) {
    if (withVariables) {
        return v ? '`' + v.replace(/`/g, '\\\`') + '`' : '\'\'';
    } else {
        return v ? '\'' + v.replace(/'/g, '\\\'') + '\'' : '\'\'';
    }
};

Formatter.prototype.expression = function (v, forceString) {
    if (v && v.indexOf('${') === 0 && v.indexOf('}') === v.length - 1) {
        return v.trim().substring(2, v.length - 1);
    } else if (!forceString && this.numberLikeRegex.test(v.trim())) { // keep numbers as they are
        return v;
    } else if (/^['"].*['"]$/.test(v)) { // treat as string and keep it as is
        return v;
    } else {
        return v ? '`' + v.replace(/`/g, '\\`') + '`' : '\'\'';
    }
};

Formatter.prototype.comparisonExpression = function (left, right) {
    var operator = '=';
    if (right.indexOf('<') === 0 || right.indexOf('>') === 0) {
        operator = right.substring(0, 1);
        right = right.substring(1);
    }
    return this.expression(left) + ' ' + operator + ' ' + this.expression(right);
};

Formatter.prototype.stringify = function (testCase) {
    const content = [];
    const self = this;
    let indentLevel = 0;
    let standardIndentLevel = 0;
    let inDescBlock = false;
    let variables = [];
    let noDescOrExportCommand = true;
    push('\'use strict\'');
    push(this.endOfLine);

    // handle variables
    testCase.commands.forEach((cmd, index) => {
        // all store commands will create a new variable that can be used in locators or comparison
        if (cmd.value && cmd.type.indexOf('store') === 0 && variables.indexOf(cmd.value) === -1 && cmd.value.indexOf('data.') === -1) {
            variables.push(cmd.value);
        }
        if (cmd.type === handlers.desc.type || cmd.type === handlers.export.type) {
            noDescOrExportCommand = false;
        }
    });
    // in case desc or export command is not used, define variables in top most scope
    if (noDescOrExportCommand && variables.length > 0) {
        push('let ' + variables.join(', ') + ';' + this.endOfLine.repeat(2));
    }
    // do we return a function or just run once?
    if (testCase.commands.length && testCase.commands[0].type === handlers.export.type) {
        standardIndentLevel++;
    }
    testCase.commands.forEach((cmd) => {
        const handler = getHandler(cmd);
        const res = handler(cmd, this);

        // handle multiple desc commands
        if (handler.type === handlers.desc.type) {
            if (inDescBlock) {
                standardIndentLevel--;
            }
            closeIfNeeded(standardIndentLevel);
            standardIndentLevel++;
            inDescBlock = true;
        }
        // should close the block if needed
        if (handler.closeBlockBefore) {
            closeIfNeeded(standardIndentLevel);
        }

        if (Array.isArray(res)) {
            res.forEach(push);
        } else {
            push(res);
        }
        if (handler.scoped) {
            indentLevel++;
        }
        // variables should be declared inside first desc block or export block
        if (variables.length > 0 && (handler.type === handlers.desc.type || handler.type === handlers.export.type)) {
            push('let ' + variables.join(', ') + ';' + this.endOfLine.repeat(2));
            variables = [];
        }
    });

    closeIfNeeded(0);

    return content.join('');

    function getHandler(cmd) {
        let handler = handlers[cmd.type.toLowerCase()];
        if (!handler) {
            if (cmd.type.indexOf('assert') === 0) {
                handler = handlers['defaultassert'];
            } else if (cmd.type.indexOf('store') === 0) {
                handler = handlers['defaultstore'];
            } else if (cmd.type.indexOf('verify') === 0) {
                handler = handlers['defaultverify'];
            } else if (cmd.type.indexOf('echo') === 0) {
                handler = handlers['defaultecho'];
            } else {
                handler = handlers['default'];
            }
        }
        return handler;
    }

    function push(v) {
        content.push(self.indent(indentLevel) + v);
    }

    function closeIfNeeded(toLevel) {
        while (indentLevel > toLevel) {
            indentLevel--;
            push('});' + self.endOfLine.repeat(2));
        }
    }
};

