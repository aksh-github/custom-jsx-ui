declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }

  type Element =
    | {
        type: string;
        props: any;
        children: any[];
        key?: string | undefined;
        value?: any;
        $t?: number;
        $c?: string;
        $p?: string;
      }
    | null
    | undefined
    | string
    | number
    | boolean;
}
