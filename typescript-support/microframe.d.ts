declare module "@vdom-lib" {
  export type VNode = {
    type?: string;
    value?: unknown;
    props?: Record<string, unknown>;
    children?: unknown[];
    key?: string | number;
  };

  export type Component<P = Record<string, unknown>> = (
    props: P,
    children?: unknown[],
  ) => VNode | VNode[] | string | number | boolean | null | undefined;

  export function h(
    type: string | Component,
    props?: Record<string, unknown> | null,
    ...children: unknown[]
  ): VNode;

  export function df(...children: unknown[]): unknown[];

  export function mount(root: Element, render: () => unknown): void;
  export function hydrate(root: Element, render: () => unknown): void;
  export function forceUpdate(): void;
  export function createElement(node: unknown): Node;

  export function createState<T>(
    initialValue: T,
  ): [T, (value: T | ((current: T) => T)) => void, (value: T) => void];

  export function createEffect(
    effect: () => void | (() => void),
    deps?: unknown[],
  ): void;

  export function createContext<T>(initialValue: T): {
    get: () => T;
    set: (value: T | ((current: T) => T)) => void;
  };

  export function createRef<T>(
    initialValue: T,
  ): [T, (value: T | ((current: T) => T)) => void];

  export function memo<P>(component: Component<P>, key?: string): Component<P>;
  export function Lazy(props: Record<string, unknown>): unknown;
  export function reset(): void;
  export function skipUpdate(callback: () => void): void;
  export function batch(callback: () => void): void;
}

declare namespace JSX {
  type Element = import("@vdom-lib").VNode;

  interface IntrinsicElements {
    [elementName: string]: Record<string, unknown>;
  }
}
