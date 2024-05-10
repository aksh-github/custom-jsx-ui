// https://gist.github.com/1Marc/09e739caa6a82cc176ab4c2abd691814
// or
// https://frontendmasters.com/courses/reactivity-solidjs/

let context = [];
let forceUpdate = () => {};
let batchOp = false;

export const registerRenderCallback = (cb) => {
  forceUpdate = cb;
};

export function untrack(fn) {
  console.log(context);
  const prevContext = context;
  context = [];
  const res = fn();
  context = prevContext;
  return res;
}

function cleanup(observer) {
  for (const dep of observer.dependencies) {
    dep.delete(observer);
  }
  observer.dependencies.clear();
}

function subscribe(observer, subscriptions) {
  subscriptions.add(observer);
  observer.dependencies.add(subscriptions);
}

export function batch(cb) {
  batchOp = true;
  cb();
  forceUpdate();
  batchOp = false;
}

export function createSignal(value) {
  const subscriptions = new Set();

  const read = () => {
    const observer = context[context.length - 1];
    if (observer) subscribe(observer, subscriptions);
    return value;
  };
  const write = (newValue) => {
    value = newValue;
    for (const observer of [...subscriptions]) {
      observer.execute();
    }
    // untrack();
    if (!batchOp) forceUpdate();
  };

  return [read, write];
}

export function createEffect(fn) {
  const effect = {
    execute() {
      cleanup(effect);
      context.push(effect);
      fn();
      context.pop();
    },
    dependencies: new Set(),
  };

  effect.execute();
}

export function createMemo(fn) {
  const [signal, setSignal] = createSignal();
  createEffect(() => setSignal(fn()));
  return signal;
}
