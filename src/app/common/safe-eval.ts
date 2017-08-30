export function safeEval(context, code) {
  const header = ['var module = undefined'];
  Object.keys(context).forEach((key) => {
    header.push(key + '=context.' + key);
  });
  // tslint:disable-next-line:no-eval
  return eval(header.join(',') + ';' + code);
}
