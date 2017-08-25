export function safeEval(context, code) {
  let header = ['var module = undefined'];
  Object.keys(context).forEach((key) => {
    header.push(key + '=context.' + key);
  });
  return eval(header.join(',') + ';' + code);
}