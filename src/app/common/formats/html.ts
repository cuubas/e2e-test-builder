import { BaseFormatter } from './base';
import { TestCase, TestCaseItem } from 'app/common/model';

export class HtmlFormatter extends BaseFormatter {
  private charsMap: { [index: string]: string };

  public constructor() {
    super();
    this.name = 'html';
    this.extension = '.html';
    this.charsMap = {
      '<': 'lt',
      '>': 'gt',
      '"': 'quot',
      '&': 'amp'
    };
  }

  private escapeAttribute(value) {
    return (value || '').replace(/"/g, '\"');
  }

  private escapeHtml(value) {
    if (typeof (value) === 'undefined' || value === null) {
      value = '';
    }
    value = String(value);
    return value.replace(/[<>"&]/g, (char) => {
      return '&' + this.charsMap[char] + ';';
    });
  }

  public parse(content: string): TestCase {
    const result = new TestCase();

    content = content || '';
    content = content.replace(/<script/g, ' <no-script').replace(/<\/script/g, ' </no-script');
    if (content.indexOf('<html') !== -1) {
      const div = document.createElement('div');
      div.innerHTML = content;
      result.title = div.querySelector('title').textContent;
      result.baseUrl = div.querySelector('link[rel="selenium.base"]').getAttribute('href');

      Array.prototype.forEach.call(div.querySelector('table tbody').childNodes, (node) => {
        if (node.nodeType === 8 && node.textContent.trim() !== '') { // comment
          result.items.push(new TestCaseItem({
            type: 'comment',
            value: node.textContent
          } as TestCaseItem));
        } else if (node.nodeType === 1) { // tag
          result.items.push(new TestCaseItem({
            type: 'command',
            command: node.children[0].textContent,
            locator: node.children[1].textContent,
            value: node.children[2].textContent
          }));
        }
      });
    }
    return result;
  }

  public stringify(testCase: TestCase): string {
    const content = testCase.items.map((item) => {
      if (item.type === 'comment') {
        return `<!--${this.escapeHtml(item.value)}-->`;
      } else {
        return '<tr>'
          + `\n\t<td>${this.escapeHtml(item.command)}</td>`
          + `\n\t<td>${this.escapeHtml(item.locator)}</td>`
          + `\n\t<td>${this.escapeHtml(item.value)}</td>`
          + '\n</tr>';
      }
    }).join('\n');
    const prefix = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
<head profile="http://selenium-ide.openqa.org/profiles/test-case">
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<link rel="selenium.base" href="${this.escapeAttribute(testCase.baseUrl)}" />
<title>${this.escapeHtml(testCase.title)}</title>
</head>
<body>
<table cellpadding="1" cellspacing="1" border="1">
<thead>
<tr><td rowspan="1" colspan="3">${this.escapeHtml(testCase.title)}</td></tr>
</thead><tbody>
`;
    const suffix = `\n</tbody></table>\n\t</body>\n\t</html>\n\t`;

    return prefix + content + suffix;
  }
}
