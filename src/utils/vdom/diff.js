// import { createElement, applyPatches } from "./vdom-lib";

/**
 * Utility function to pretty-print patches for debugging
 */
export function printPatches(patches) {
  console.log("=== Patches ===");
  patches.forEach((patch, idx) => {
    console.log(`\n[${idx}] ${patch.op} at path: ${patch.path || "root"}`);
    console.log("Path Array:", patch.pathArray);

    if (patch.newNode) {
      console.log("newNode:", JSON.stringify(patch.newNode, null, 2));
    }
    if (patch.oldNode) {
      console.log("oldNode:", JSON.stringify(patch.oldNode, null, 2));
    }
    if (patch.node) {
      console.log("node:", JSON.stringify(patch.node, null, 2));
    }
    if (patch.newProps) {
      console.log("newProps:", JSON.stringify(patch.newProps, null, 2));
    }
    if (patch.oldProps) {
      console.log("oldProps:", JSON.stringify(patch.oldProps, null, 2));
    }
  });
}

/**
 * Get patch statistics for debugging
 */
export function getPatchStats(patches) {
  const stats = {
    total: patches.length,
    APPEND: 0,
    REMOVE: 0,
    REPLACE: 0,
    UPDATE_PROPS: 0,
  };

  patches.forEach((patch) => {
    if (stats[patch.op] !== undefined) {
      stats[patch.op]++;
    }
  });

  return stats;
}

// const d1 = {
//   type: "df",
//   props: {
//     currentUrl: "/",
//   },
//   children: [
//     {
//       type: "div",
//       props: {},
//       children: [
//         {
//           type: "h2",
//           props: {},
//           children: ["SSR App"],
//         },
//         {
//           type: "p",
//           props: {},
//           children: [null, null, true, false],
//         },
//         {
//           type: "script",
//           props: {
//             id: "dyn-script",
//           },
//           children: [],
//         },
//         {
//           type: "a",
//           props: {
//             href: "javascript:alert(10)",
//           },
//           children: ["Dangerous link"],
//         },
//         {
//           type: "button",
//           props: {},
//           children: ["Increment"],
//         },
//         {
//           type: "hr",
//           props: {},
//           children: [],
//         },
//         {
//           type: "df",
//           props: null,
//           children: null,
//           $c: "Decide:SsrApp:undefined",
//         },
//         {
//           type: "hr",
//           props: {},
//           children: [],
//         },
//         {
//           type: "df",
//           props: {
//             value: 20,
//           },
//           children: [
//             {
//               type: "div",
//               props: {
//                 className: "some-20",
//                 style: {
//                   background: "blue",
//                 },
//               },
//               children: ["this is 20"],
//             },
//           ],
//           $c: "Switch:SsrApp:undefined",
//         },
//         {
//           type: "hr",
//           props: {},
//           children: [],
//         },
//         {
//           type: "df",
//           updtFlag: true,
//           props: {},
//           children: [
//             {
//               type: "df",
//               updtFlag: true,
//               props: {
//                 resolve: "TextArea",
//                 key: "TextArea",
//                 fallback: {
//                   type: "section",
//                   props: {},
//                   children: ["Loading TextArea..."],
//                 },
//               },
//               children: [
//                 {
//                   type: "df",
//                   updtFlag: true,
//                   props: {
//                     key: "TextArea",
//                   },
//                   children: [
//                     {
//                       type: "section",
//                       updtFlag: true,
//                       props: {
//                         style: {
//                           backgroundColor: "beige",
//                         },
//                       },
//                       children: [
//                         {
//                           type: "button",
//                           updtFlag: true,
//                           props: {},
//                           children: ["Clear"],
//                         },
//                         {
//                           type: "span",
//                           updtFlag: true,
//                           props: {},
//                           children: [""],
//                         },
//                         {
//                           type: "input",
//                           updtFlag: true,
//                           props: {
//                             value: "",
//                             id: "comp-in",
//                           },
//                           children: [],
//                         },
//                       ],
//                     },
//                   ],
//                   $c: "TextArea:Lazy:TextArea",
//                   key: "TextArea",
//                 },
//               ],
//               $c: "Lazy:DynTextArea:TextArea",
//               key: "TextArea",
//             },
//           ],
//           $c: "DynTextArea:SsrApp:undefined",
//         },
//         {
//           type: "form",
//           props: {},
//           children: [
//             {
//               type: "input",
//               props: {
//                 value: "",
//               },
//               children: [],
//             },
//             {
//               type: "button",
//               props: {
//                 type: "submit",
//               },
//               children: ["Submit"],
//             },
//           ],
//         },
//         {
//           type: "df",
//           props: {
//             ctr: 0,
//           },
//           children: [
//             {
//               type: "p",
//               props: {},
//               children: [0],
//             },
//           ],
//           $c: "Child:SsrApp:undefined",
//         },
//         {
//           type: "div",
//           props: {
//             ignoreNode: true,
//           },
//           children: [],
//         },
//         {
//           type: "df",
//           props: {
//             loading: "Loading...",
//             error: "Error loading data",
//             key: "api/1",
//           },
//           children: [
//             {
//               type: "div",
//               props: {},
//               children: ["Error loading data"],
//             },
//           ],
//           $c: "Loader:SsrApp:api/1",
//           key: "api/1",
//         },
//         {
//           type: "df",
//           props: {
//             loading: "Loading...",
//             error: "Error loading data",
//             key: "api/2",
//           },
//           children: [
//             {
//               type: "div",
//               props: {},
//               children: ["Error loading data"],
//             },
//           ],
//           $c: "Loader:SsrApp:api/2",
//           key: "api/2",
//         },
//         {
//           type: "df",
//           props: {},
//           children: [
//             {
//               type: "div",
//               props: {},
//               children: [
//                 null,
//                 {
//                   type: "button",
//                   props: {},
//                   children: ["Set Online"],
//                 },
//                 {
//                   type: "button",
//                   props: {},
//                   children: ["Set Offline"],
//                 },
//                 {
//                   type: "p",
//                   props: {},
//                   children: ["Online status: ", "Offline"],
//                 },
//                 {
//                   type: "hr",
//                   props: {},
//                   children: [],
//                 },
//                 {
//                   type: "df",
//                   props: {},
//                   children: [
//                     {
//                       type: "div",
//                       props: {},
//                       children: [
//                         {
//                           type: "div",
//                           props: {},
//                           children: [
//                             " ",
//                             {
//                               type: "p",
//                               props: {
//                                 key: 0,
//                               },
//                               children: ["a", " "],
//                             },
//                             {
//                               type: "section",
//                               props: {
//                                 ignoreNode: true,
//                               },
//                               children: [],
//                             },
//                           ],
//                         },
//                         {
//                           type: "div",
//                           props: {},
//                           children: [
//                             " ",
//                             {
//                               type: "p",
//                               props: {
//                                 key: 1,
//                               },
//                               children: ["b", " "],
//                             },
//                             {
//                               type: "section",
//                               props: {
//                                 ignoreNode: true,
//                               },
//                               children: [],
//                             },
//                           ],
//                         },
//                         {
//                           type: "div",
//                           props: {},
//                           children: [
//                             " ",
//                             {
//                               type: "p",
//                               props: {
//                                 key: 2,
//                               },
//                               children: ["c", " "],
//                             },
//                             {
//                               type: "section",
//                               props: {
//                                 ignoreNode: true,
//                               },
//                               children: [],
//                             },
//                           ],
//                         },
//                       ],
//                     },
//                   ],
//                   $c: "Messages:Form:undefined",
//                 },
//                 null,
//                 {
//                   type: "form",
//                   props: {},
//                   children: [
//                     {
//                       type: "textarea",
//                       props: {
//                         value: "",
//                       },
//                       children: [],
//                     },
//                     {
//                       type: "button",
//                       props: {
//                         disabled: true,
//                         type: "submit",
//                       },
//                       children: ["Submit"],
//                     },
//                   ],
//                 },
//                 null,
//               ],
//             },
//           ],
//           $c: "Form:SsrApp:undefined",
//         },
//       ],
//     },
//   ],
//   $c: "SsrApp:undefined:undefined",
// };

// const d2 = {
//   type: "df",
//   updtFlag: true,
//   props: {
//     currentUrl: "/",
//   },
//   children: [
//     {
//       type: "div",
//       updtFlag: true,
//       props: {},
//       children: [
//         {
//           type: "h2",
//           updtFlag: true,
//           props: {},
//           children: ["SSR App"],
//         },
//         {
//           type: "p",
//           updtFlag: true,
//           props: {},
//           children: [null, null, true, false],
//         },
//         {
//           type: "script",
//           updtFlag: true,
//           props: {
//             id: "dyn-script",
//           },
//           children: [],
//         },
//         {
//           type: "a",
//           updtFlag: true,
//           props: {
//             href: "javascript:alert(10)",
//           },
//           children: ["Dangerous link"],
//         },
//         {
//           type: "button",
//           updtFlag: true,
//           props: {},
//           children: ["Increment"],
//         },
//         {
//           type: "hr",
//           updtFlag: true,
//           props: {},
//           children: [],
//         },
//         {
//           $c: "Decide:SsrApp:undefined",
//           value: null,
//           props: {
//             count: 1,
//           },
//         },
//         {
//           type: "hr",
//           updtFlag: true,
//           props: {},
//           children: [],
//         },
//         {
//           type: "df",
//           props: {
//             value: 20,
//           },
//           children: [
//             {
//               type: "div",
//               props: {
//                 className: "some-20",
//                 style: {
//                   background: "blue",
//                 },
//               },
//               children: ["this is 20"],
//             },
//           ],
//           $c: "Switch:SsrApp:undefined",
//         },
//         {
//           type: "hr",
//           updtFlag: true,
//           props: {},
//           children: [],
//         },
//         {
//           type: "df",
//           props: {},
//           children: [
//             {
//               type: "df",
//               props: {
//                 resolve: "TextArea",
//                 key: "TextArea",
//                 fallback: {
//                   type: "section",
//                   props: {},
//                   children: ["Loading TextArea..."],
//                 },
//               },
//               children: [
//                 {
//                   type: "df",
//                   props: {
//                     key: "TextArea",
//                   },
//                   children: [
//                     {
//                       type: "section",
//                       props: {
//                         style: {
//                           backgroundColor: "beige",
//                         },
//                       },
//                       children: [
//                         {
//                           type: "button",
//                           props: {},
//                           children: ["Clear"],
//                         },
//                         {
//                           type: "span",
//                           props: {},
//                           children: [""],
//                         },
//                         {
//                           type: "input",
//                           props: {
//                             value: "",
//                             id: "comp-in",
//                           },
//                           children: [],
//                         },
//                       ],
//                     },
//                   ],
//                   $c: "TextArea:Lazy:TextArea",
//                   key: "TextArea",
//                 },
//               ],
//               $c: "Lazy:DynTextArea:TextArea",
//               key: "TextArea",
//             },
//           ],
//           $c: "DynTextArea:SsrApp:undefined",
//         },
//         {
//           type: "form",
//           updtFlag: true,
//           props: {},
//           children: [
//             {
//               type: "input",
//               updtFlag: true,
//               props: {
//                 value: "",
//               },
//               children: [],
//             },
//             {
//               type: "button",
//               updtFlag: true,
//               props: {
//                 type: "submit",
//               },
//               children: ["Submit"],
//             },
//           ],
//         },
//         {
//           type: "df",
//           props: {
//             ctr: 1,
//           },
//           children: [
//             {
//               type: "p",
//               props: {},
//               children: [1],
//             },
//           ],
//           $c: "Child:SsrApp:undefined",
//         },
//         {
//           type: "div",
//           updtFlag: true,
//           props: {
//             ignoreNode: true,
//           },
//           children: [],
//         },
//         {
//           type: "df",
//           props: {
//             loading: "Loading...",
//             error: "Error loading data",
//             key: "api/1",
//           },
//           children: [
//             {
//               type: "div",
//               props: {},
//               children: ["Error loading data"],
//             },
//           ],
//           $c: "Loader:SsrApp:api/1",
//           key: "api/1",
//         },
//         {
//           type: "df",
//           props: {
//             loading: "Loading...",
//             error: "Error loading data",
//             key: "api/2",
//           },
//           children: [
//             {
//               type: "div",
//               props: {},
//               children: ["Error loading data"],
//             },
//           ],
//           $c: "Loader:SsrApp:api/2",
//           key: "api/2",
//         },
//         {
//           type: "df",
//           props: {},
//           children: [
//             {
//               type: "div",
//               props: {},
//               children: [
//                 null,
//                 {
//                   type: "button",
//                   props: {},
//                   children: ["Set Online"],
//                 },
//                 {
//                   type: "button",
//                   props: {},
//                   children: ["Set Offline"],
//                 },
//                 {
//                   type: "p",
//                   props: {},
//                   children: ["Online status: ", "Offline"],
//                 },
//                 {
//                   type: "hr",
//                   props: {},
//                   children: [],
//                 },
//                 {
//                   type: "df",
//                   props: {},
//                   children: [
//                     {
//                       type: "div",
//                       props: {},
//                       children: [
//                         {
//                           type: "div",
//                           props: {},
//                           children: [
//                             " ",
//                             {
//                               type: "p",
//                               props: {
//                                 key: 0,
//                               },
//                               children: ["a", " "],
//                             },
//                             {
//                               type: "section",
//                               props: {
//                                 ignoreNode: true,
//                               },
//                               children: [],
//                             },
//                           ],
//                         },
//                         {
//                           type: "div",
//                           props: {},
//                           children: [
//                             " ",
//                             {
//                               type: "p",
//                               props: {
//                                 key: 1,
//                               },
//                               children: ["b", " "],
//                             },
//                             {
//                               type: "section",
//                               props: {
//                                 ignoreNode: true,
//                               },
//                               children: [],
//                             },
//                           ],
//                         },
//                         {
//                           type: "div",
//                           props: {},
//                           children: [
//                             " ",
//                             {
//                               type: "p",
//                               props: {
//                                 key: 2,
//                               },
//                               children: ["c", " "],
//                             },
//                             {
//                               type: "section",
//                               props: {
//                                 ignoreNode: true,
//                               },
//                               children: [],
//                             },
//                           ],
//                         },
//                       ],
//                     },
//                   ],
//                   $c: "Messages:Form:undefined",
//                 },
//                 null,
//                 {
//                   type: "form",
//                   props: {},
//                   children: [
//                     {
//                       type: "textarea",
//                       props: {
//                         value: "",
//                       },
//                       children: [],
//                     },
//                     {
//                       type: "button",
//                       props: {
//                         disabled: true,
//                         type: "submit",
//                       },
//                       children: ["Submit"],
//                     },
//                   ],
//                 },
//                 null,
//               ],
//             },
//           ],
//           $c: "Form:SsrApp:undefined",
//         },
//       ],
//     },
//   ],
//   $c: "SsrApp:undefined:undefined",
// };
// console.log("===== Diffing d1 and d2 =====");

// console.time("diff");
// console.log(diff(d1, d2));
// console.timeEnd("diff");
