exports.config = {
  framework: 'jasmine',
  seleniumAddress: 'http://localhost:4444/wd/hub', // run webdriver-manager start
  specs: ['./*.spec.js'],
  capabilities: {
    browserName: 'chrome'
  },
  // SELENIUM_PROMISE_MANAGER: false
};