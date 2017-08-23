module.exports = function (module) {
  var SettingComponent = {
    bindings: {
      testCase: '<',
      settings: '<',
      extensions: '<'
    },
    template: require('./settings.partial.html'),
    controller: 'SettingsController'
  };

  require('./settings.controller')(module);

  module.component('settings', SettingComponent);
}