module.exports = {
  name: 'html',
  test: test,
  parse: parse,
  stringify: stringify
};

function test(filename) {
  filename = filename || '';
  return filename.indexOf('.html') === filename.length - 5;
}

function escapeAttribute(value) {
  return (value || '').replace(/"/g, '\"');
}
var charsMap = {
  '<': 'lt',
  '>': 'gt',
  '"': 'quot',
  '&': 'amp'
};
function escapeHtml(value) {
  if (typeof (value) === 'undefined' || value === null) {
    value = '';
  }
  value = String(value);
  return value.replace(/[<>"&]/g, (char) => {
    return '&' + charsMap[char] + ';';
  });
}

function parse(content) {
  var result = {};
  result.items = [];

  content = content || '';
  content = content.replace(/<script/g, ' <no-script').replace(/<\/script/g, ' </no-script');
  if (content.indexOf('<html') !== -1) {
    var div = document.createElement('div');
    div.innerHTML = content;
    result.title = div.querySelector('title').textContent;
    result.baseUrl = div.querySelector('link[rel="selenium.base"]').getAttribute('href');
    div.querySelector('table tbody').childNodes.forEach(function (node) {
      if (node.nodeType === 8 && node.textContent.trim() !== '') { // comment
        result.items.push({
          type: 'comment',
          value: node.textContent
        });
      } else if (node.nodeType === 1) { //tag
        result.items.push({
          type: 'command',
          command: node.children[0].textContent,
          locator: node.children[1].textContent,
          value: node.children[2].textContent
        });
      }
    });
  }
  return result;
}

function stringify(testCase) {
  var content = testCase.items.map((item) => {
    if (item.type === 'comment') {
      return `<!--${escapeHtml(item.value)}-->`;
    } else {
      return `<tr>
	<td>${escapeHtml(item.command)}</td>
	<td>${escapeHtml(item.locator)}</td>
	<td>${escapeHtml(item.value)}</td>
</tr>`
    }
  }).join('\n');
  var prefix = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
<head profile="http://selenium-ide.openqa.org/profiles/test-case">
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<link rel="selenium.base" href="${escapeAttribute(testCase.baseUrl)}" />
<title>${escapeHtml(testCase.title)}</title>
</head>
<body>
<table cellpadding="1" cellspacing="1" border="1">
<thead>
<tr><td rowspan="1" colspan="3">${escapeHtml(testCase.title)}</td></tr>
</thead><tbody>
`;
  var suffix = `
</tbody></table>
</body>
</html>
`;

  return prefix + content + suffix;
}