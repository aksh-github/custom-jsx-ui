/**
 * Type definitions for router-v2.jsx
 */

export interface LinkV2Props {
  to: string;
  replace?: boolean;
  children?: any[];
}

export function LinkV2(props: LinkV2Props, children?: any[]): any;

export interface RouterLocation {
  search: string;
  hash: string;
  state: any;
  pathname: string;
  isExact?: boolean;
}

export interface MatchPathOptions {
  exact?: boolean;
  path?: string;
}

export interface MatchPathResult {
  pathname: string;
  isExact: boolean;
}

export interface HistoryNavigator {
  go: (path: string, state?: any) => void;
  replace: (path: string) => void;
}

export interface RouterInstance {
  init: (callback?: (config: RouterLocation) => void) => void;
  cleanup: () => void;
  navigator: HistoryNavigator;
}

export const routerContext: {
  get: () => RouterLocation;
  set: (value: RouterLocation) => void;
};

export const routerInstance: RouterInstance;

export interface RouterAdvProps {
  routeObj: {
    [path: string]: any;
    "404"?: any;
  };
}

export function RouterAdv(props: RouterAdvProps): any;

export function matchPath(
  pathname: string,
  options: MatchPathOptions
): MatchPathResult | null;

export function historyPush(path: string, state?: any): void;

export function historyReplace(path: string): void;
