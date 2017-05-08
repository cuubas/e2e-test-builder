# e2e test builder

Chrome extension which allows you to record interactions and perform various assertions. Compatible with Selenium IDE test cases.

[Install extension from chrome web store](https://chrome.google.com/webstore/detail/e2e-test-builder/pamfkepooglpdkepmlopejpmcpggaobo)

---
## concept

In short: tag key elements with a custom attribute (e.g. test-id="input--name"), specify the name in settings and begin recording flows with reliable locators. 

Convert these recorded test cases into code and use them as building blocks to make various suites that will eventually test your entire app. (need permission to open source protractor formatter)

... to be continued

## extensions

user extension is an additional javascript file that is executed in page context and have access to entire page and a test runner object. Runner itself is built with extensions in mind and allows you to add commands/accessors and hook into execution flow rather easily.

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
runner.accesors.
```

## contributing

PRs are welcome for any open issues and feature requests. For anything new please open an issue before implementing.

## development

Most of the code base is written Javascript, except for IoProxy. At this point due to chrome extension limitations file system is accessed via Java app (uses JavaFx). Usable jar file is included in `host` / `host-win`. Java SDK and maven is required for it's development - source code is located in `src/io` and proxy is in `src/common/ioproxy.js`.

#### steps:

1. checkout repository
2. run `npm install`
3. run `gulp` (builds and watches related files)
4. go to chrome://extensions/
5. load unpacked extension - point to build directory
6. run `host/register.sh` or `host-win/register.bat` to setup native client
