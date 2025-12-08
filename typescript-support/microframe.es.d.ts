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

  export function createEffect(fn: () => void, deps: any[]): void;
  export function createContext<T>(value?: T): {
    Provider: any;
    Consumer: any;
    value: T | undefined;
  };
  export function memo<T>(fn: T): T;
  export const forceUpdate: () => void;
  export default any;

  export interface LazyProps {
    importFn: () => Promise<any>;
    resolve?: string;
    fallback?: any;
    [key: string]: any; // Add this line to accept dynamic props
  }
  export function Lazy(props: LazyProps): (...args: any[]) => any;
}
