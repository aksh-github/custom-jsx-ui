## This project is based on 
- dom (using diff-dom lib) (needs some more work to fine tune)
- virtual dom (my own) and component based like React, Jsx etc.


#### master branch: Normal test components for both above approaches. (not maintained anymore)

#### app/chat branch: Contain actual implementation of chat app (chat folder) along with master br content.  (not maintained much)


#### 15jan26-ssr: stable branch as of 28-Jan-26

**LATEST STABLE Branch**
3apr26: stable branch as of 7-Apr-26 (branch off 15jan26-ssr)

22apr26: stable branch as of 27-Apr-26 (branch off 3apr26)

#### 12may26: A variation to wrapper, diff functions etc and Ai gen, support Fragments (seems to be very promising, more testing required) (branch off 22apr26)

#### 25may26: stable branch as of 25-May-26 (Returns only html vdom nodes (no compo nodes), Event delegation impl) (branch off 22apr26)

==

#### dom-30may26: 

This is dom only based impl. Uses signal-v2 in src/utils. Attributes are auto updated because of signals. You can update dom using propsPatches or patches. Supports onMount and onUnmount on dom elems.

==

#### 12jun26-state-changes: A very Stale branch as of 19jun26 (branch off 25may26)

This has old diffing + key based diffing. Lot of improvements in Simple state. Supports async resource creation using createResource. Lazy compo improvements. 
