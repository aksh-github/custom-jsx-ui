declare module "@vdom-lib" {
  export function h(...args: any[]): any;
  export function mount(el: Element | null, fn: () => any): any;
  export function smartRegisterCallback(
    cb: (...args: any[]) => any,
    ms?: number
  ): void;

  export function batch(fn: () => void): void;

  type ValueOrFunction<T> = T | ((prevValue: T) => T);
  type State<T> = [T, (value: ValueOrFunction<T>) => void, () => void];
  export function createState<T>(initialValue: T): State<T>;

  export function createEffect(fn: () => void): void;
  export function createContext<T>(value?: T): {
    Provider: any;
    Consumer: any;
    value: T | undefined;
  };
  export function memo<T>(fn: T): T;
  export const forceUpdate: () => void;
  export default any;
  export function Lazy(fn: (...args: any[]) => any): (...args: any[]) => any;
}
