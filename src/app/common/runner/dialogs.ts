var runner = require('./../runner');

['alert', 'prompt', 'confirm'].forEach((fn) => {
  var orgFn, accessor = fn === 'confirm' ? 'confirmation' : fn;

  runner.accessors[accessor] = function (command) {
    return this.dialogs[accessor + 'Present'] && this.dialogs[accessor + 'Message'];
  };

  runner.accessors[accessor + 'Present'] = function (command) {
    return this.dialogs[accessor + 'Present'];
  };

  // override alert, prompt, confirm on start
  runner.listeners.onStart.push(() => {
    orgFn = window[fn];
    window[fn] = function (message) {
      runner.dialogs[accessor + 'Present'] = true;
      runner.dialogs[accessor + 'Message'] = message;
      return runner.dialogs[accessor + 'Result'];
    };
  });

  runner.listeners.onEnd.push(() => {
    window[fn] = orgFn;
  });
});

runner.commands.chooseOkOnNextConfirmation = function (command) {
  runner.dialogs.confirmResult = true;
};
runner.commands.chooseCancelOnNextConfirmation = function (command) {
  runner.dialogs.confirmResult = false;
};
runner.commands.answerOnNextPrompt = function (command) {
  runner.dialogs.promptResult = command.value;
};
// as per specs all confirms are automatically accepted
runner.dialogs.confirmResult = true;