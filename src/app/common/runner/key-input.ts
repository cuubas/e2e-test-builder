import { runner } from 'app/common/runner';
import { Key as SeleniumKey } from 'app/common/selenium-webdriver-input';
import { default as KeyCode } from '../../../../node_modules/keycode-js/lib/KeyCode';

const mapToKeyOptions = {};
// expose all keys as variables
Object.keys(SeleniumKey).forEach((key) => {
  runner.variables['KEY_' + key] = SeleniumKey[key];
  const keyName = key.substring(0, 1) + key.substring(1).toLowerCase();
  mapToKeyOptions[SeleniumKey[key]] = {
    code: keyName,
    key: keyName,
    which: KeyCode['KEY_' + key],
    bubbles: true
  };
});
// assign values
mapToKeyOptions[SeleniumKey.SPACE].value = ' ';
mapToKeyOptions[SeleniumKey.ENTER].value = '\n';

// TODO: handle compatibility with selenium ide

runner.createKeyEvent = function (type, options) {
  const evt = new KeyboardEvent(type, options);
  // patch known issue
  Object.defineProperty(evt, 'which', { get: function () { return options.which; } });
  Object.defineProperty(evt, 'keyCode', { get: function () { return options.which; } });

  return evt;
};

runner.simulateKeyInput = function (target, char) {
  const options = mapToKeyOptions[char] || {
    bubbles: true,
    key: char,
    code: char,
    which: char.charCodeAt(0),
    value: char
  };

  target.dispatchEvent(this.createKeyEvent('keydown', options));
  target.dispatchEvent(this.createKeyEvent('keypress', options));
  if (options.value) {
    try {
      target.value = target.value.substring(0, target.selectionStart) + options.value + target.value.substring(target.selectionEnd);
    } catch (err) {
      // some types doesnt support selection
      target.value += options.value;
    }
  }
  target.dispatchEvent(new InputEvent('input', { data: char, inputType: 'insertText', bubbles: true }));

  if (options.value === '\n' && target.form) {
    if (typeof (target.form.submit) === 'function') {
      target.form.submit();
    } else if (target.form.submit && typeof (target.form.submit.click) === 'function') {
      target.form.submit.click();
    }
  }
  target.dispatchEvent(this.createKeyEvent('keyup', options));
  target.dispatchEvent(new Event('change'));
};
