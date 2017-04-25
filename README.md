# e2e test builder

Chrome extension which allows you to record interactions and perform various assertions. Compatible with Selenium IDE test cases.

[Install extension from chrome web store](https://chrome.google.com/webstore/detail/e2e-test-builder/pamfkepooglpdkepmlopejpmcpggaobo)

---
### concept

In short: tag key elements with a custom attribute (e.g. test-id="input--name"), specify the name in settings and begin recording complicated flows with reliable locators. Use these recorded test cases as building blocks to make various suites that eventually will test your entire app.

... to be continued

### extensions

user extension is an additional javascript file that is executed in page context and have access to entire page and a test runner object.

#### Some examples:

```js
// wait for angular / skip commands
runner.onBeforeExecute = function(commands, index, callback) {
  callback(true); // false will skip command execution
  angular.getTestability(document).whenStable(callback); 
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
```