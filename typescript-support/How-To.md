
## How to Add Typescript support

**Basic start**
- Create your project with Vite Typescript support.
- We will minimy vdom lib (lets say it has name microframe.es.js).

**Type definition**
- We will add this minified js file to our newly created project in src/lib/ folder.
- Along with that add types file (microframe.es.d.ts) kept here in same folder.
- Note the module is named like @vdom-lib. This is important.
- We also need to add jsx.d.ts in same folder. Kept here in same folder.

**Vite.config.js**
- Add vite.config.js to your project as attached file here. See how the alias is used. (Same as used in types file above)
- When you are using imports you need to use import {render} from "@vdom-lib"

**tsconfig.json**

Refer the attached file here. You need to do following changes to your tsconfig file from this.
- Under compilerOptions check baseUrl, jsx, comment vdom specific paths etc. (Same as used in types file above)
- Outsider compilerOptions check include we have added lib folder, check exclude also.

