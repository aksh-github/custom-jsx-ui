## This project is based on 
- dom (using diff-dom lib) (needs some more work to fine tune)
- virtual dom (my own) and component based like React, Jsx etc.


#### master branch: (not maintained)

#### app/chat branch: (not maintained)


#### 22apr26: stable branch as of 27-Apr-26 (branch off 3apr26)

#### 12may26: A variation to wrapper, diff functions etc and Ai gen, support Fragments (seems to be very promising, more testing required) (branch off 22apr26)

#### 25may26: stable branch as of 25-May-26 (Returns only html vdom nodes (no compo nodes), Event delegation impl) (branch off 22apr26)

-----------



#### dom-30may26: 

This is `dom only based impl`. Uses `signal-v2 in src/utils`. Attributes are auto updated because of signals. You can update dom using propsPatches or patches. Supports onMount and onUnmount on dom elems.

-----------

**LATEST STABLE Branch**

#### 12jun26-state-changes: A very Stale branch as of 14jul26 (branch off 25may26)

This has old diffing + key based diffing. Lot of improvements in Simple state. Supports async resource creation using createResource. Lazy compo improvements. 

#### 9jul26-vdom-in-fncache: Seems to be a stable branch as of 14jul26 (branch off 12jun26-state-changes a very stable br)

This branch returns the thunk ` {$thunk: true, $c: "Compo:Parent:key"} ` from h. The actual vdom obj is stored in funcCache. The thunk is converted to actual vdom in diffNode() and createElement(). Perform is almost similar to 12jun26-state-changes, but has few 

`pros` 
- we can directly update vdom for a particular Compo with `funcCache["Compo:Parent:key"].vdom = new value`
- We dont have to locate vdom obj in a dense tree like for in br 12jun26-state-changes because its stored nested

`cons`
- Has slightly more code
- More mem consumption??

