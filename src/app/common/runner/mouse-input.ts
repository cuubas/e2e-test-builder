
import { runner } from 'app/common/runner';

runner.createMouseEvent = function (type, options) {
  const ev = new MouseEvent(type, options);
  return ev;
};

runner.fireMouseEvent = function (type, button, command) {
  const el = this.findElement(command.locator);
  let coords = command.value.split(',');
  const rect = el.getBoundingClientRect();
  if (coords.length === 2) {
    coords = [parseInt(coords[0], 10), parseInt(coords[1], 10)];
  } else {
    coords = [rect.width / 2, rect.height / 2];
  }
  el.dispatchEvent(this.createMouseEvent(type, {
    button: button,
    clientX: rect.left + coords[0],
    clientY: rect.top + coords[1]
  }));
};

runner.commands.mouseDown = runner.fireMouseEvent.bind(runner, 'mousedown', 0);
runner.commands.mouseDownAt = runner.fireMouseEvent.bind(runner, 'mousedown', 0);
runner.commands.mouseUp = runner.fireMouseEvent.bind(runner, 'mouseup', 0);
runner.commands.mouseUpAt = runner.fireMouseEvent.bind(runner, 'mouseup', 0);
runner.commands.mouseDownRight = runner.fireMouseEvent.bind(runner, 'mousedown', 2);
runner.commands.mouseDownRightAt = runner.fireMouseEvent.bind(runner, 'mousedown', 2);
runner.commands.mouseUpRight = runner.fireMouseEvent.bind(runner, 'mouseup', 2);
runner.commands.mouseUpRightAt = runner.fireMouseEvent.bind(runner, 'mouseup', 2);
