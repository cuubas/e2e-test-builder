module.exports = IdLocator;

function IdLocator(target, settings) {
  if (target.id) {
    return 'id=' + target.id
  }
}

IdLocator.find = function (locator, parent) {
  return parent.querySelectorAll('#' + locator);
};