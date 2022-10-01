# e2e test builder

[![Travis CI build](https://travis-ci.org/cuubas/e2e-test-builder.svg)](https://travis-ci.org/cuubas/e2e-test-builder)

Chrome extension which allows you to record interactions and perform various assertions. Compatible with Selenium IDE test cases.

[Install extension from chrome web store](https://chrome.google.com/webstore/detail/e2e-test-builder/pamfkepooglpdkepmlopejpmcpggaobo)

---
## concept

In short: tag key elements with a custom attribute (e.g. e2e-tag="input--name"), specify the name in settings and begin recording flows with reliable locators. 

Test cases can be exported in selenium ide html format or as jasmine/protractor spec file that can be executed almost directly. The later exports a function that accepts 2 parameters: config and data.

See `/examples` on how to use them.

## extensions

User extension is an additional javascript file that is executed in page context and have access to entire page and a test runner object. Runner itself is built with extensions in mind and allows you to add commands/accessors and hook into execution flow rather easily. New commands and accesors will automatically appear in suggestions list in ui window.

#### Some examples:

```js
// wait for angular / skip commands
runner.onBeforeExecute = function(commands, index, callback) {
  callback(true); // false will skip command execution
  angular.getTestability(document.documentElment).whenStable(callback); 
};
// sync
runner.commands.custom = function (command) {
  var element = runner.findElement(command.locator);
  jQuery(element).trigger('change');
};
// async
runner.commands.customAsync = function (command, callback) {
  callback(runner.STATES.DONE|FAILED, 'Hello from custom command');
};
// registering below accessor will enable assertAriaLabel, asertNotAriaLabel, verifyAriaLabel, verifyNotAriaLabel, waitForAriaLabel, waitForNotAriaLabel, echoAriaLabel, storeAriaLabel commands
runner.accesors.ariaLabel = function (command) {
  return this.findElement(command.locator).getAttribute('aria-label');
};
```

## contributing

PRs are welcome for any open issues and feature requests. For anything new please open an issue before implementing.

## development

Most of the code base is written TypeScript.

#### steps:

1. checkout repository
2. run `npm install`
3. run `npm start` (builds and watches 3 angular-cli apps - background, content and ui)
4. go to chrome://extensions/
5. load unpacked extension - point to build directory
