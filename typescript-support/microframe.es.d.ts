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
    get: Function;
    set: Function;
  };
  export function memo<T>(fn: T): T;
  export const forceUpdate: () => void;

  export interface LazyProps {
    importFn: () => Promise<any>;
    resolve?: string;
    fallback?: any;
    [key: string]: any; // Add this line to accept dynamic props
  }
  export function Lazy(
    props: LazyProps
  ): (...args: any[]) => JSX.Element | null | undefined;

  // Switch compo

  // export const Switch = {
  //   Case,
  //   Default,
  // };

  export type AnyProps = Record<string, any>;
  export type VNodeLike = {
    $t?: number;
    props?: AnyProps;
    value?: AnyProps;
    children?: any;
  };

  /** Component type used by component prop */
  export type ComponentType<P = any> = (props?: P) => any;

  /** Props accepted by the top-level Switch */
  export interface SwitchProps {
    value?: number | string | boolean;
    children?: VNodeLike[] | VNodeLike | null;
  }

  /** Props for Case component */
  export interface CaseProps {
    when: any;
    component?: ComponentType<any>;
    render?: (props?: any) => any;
    children?: JSX.Element | null;
  }

  /** Props for Default component */
  export interface DefaultProps {
    component?: ComponentType<any>;
    render?: (props?: any) => any;
    children?: any;
  }

  /** Switch function with attached sub-components */
  export interface SwitchComponent {
    (props: SwitchProps, children?: any): JSX.Element | null;
    Case: (props: CaseProps, children?: any) => JSX.Element | null;
    Default: (props: DefaultProps, children?: any) => JSX.Element | null;
  }

  export declare const Switch: SwitchComponent;
  export declare function Case(
    props: CaseProps,
    children?: any
  ): JSX.Element | null;
  export declare function Default(
    props: DefaultProps,
    children?: any
  ): JSX.Element | null;
}
