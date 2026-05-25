import JsonForm from "./jsonform";
import { h, createEffect, createState } from "../../utils/vdom/vdom-lib";
import { loadUI } from "./utils";
import "./form.css";

// const Playground = () => {
//   const [json, setJson] = createState(null);
//   const [parseResult, setParseResult] = createState(null);

//   // const effect = createEffect();

//   return (
//     <div>
//       <h1>Playground</h1>
//       <div
//         className="pg-container"
//         style={{
//           display: "flex",
//           gap: "1em",
//           border: "1px solid #ccc",
//           borderRadius: ".2em",
//           padding: "1em",
//         }}
//       >
//         <div>
//           <textarea
//             name=""
//             id=""
//             onInput={(e) => {
//               setJson(JSON.parse(e.target.value));
//               console.log(e.target.value);
//             }}
//             value={JSON.stringify(json, null, 2)}
//             cols="30"
//             rows="10"
//           ></textarea>
//         </div>

//         <div>
//           {json?.form?.children.map((field, idx) => (
//             <Field
//               // key={field.name + idx + field.name}
//               field={field}
//               state={field}
//             />
//           ))}
//         </div>
//       </div>
//       <pre>
//         <code>{parseResult}</code>
//       </pre>
//     </div>
//   );
// };

let nextJsonFormConsumerId = 0;

export const JsonFormConsumer = (props = {}) => {
  const [instanceId] = createState(
    props.instanceId ||
      props.key ||
      `json-form-consumer-${++nextJsonFormConsumerId}`,
  );
  const [uiJson, setUiJson] = createState(null);
  const [usecaseChanged, setUsecaseChanged] = createState(false);

  // vv imp func: this is all business logic
  const onFormChange = (formData, currrentValue) => {
    if (currrentValue?.name === "selectUsecase") {
      setUsecaseChanged(true);

      // modify the form json based on the selected use case
      setUiJson((prevUiJson) => {
        return {
          ...prevUiJson,
          form: {
            ...prevUiJson.form,
            children: prevUiJson.form.children // .filter((field, idx) => idx === 0)
              .filter((field) => field.name === "selectUsecase")
              .concat(prevUiJson.more[currrentValue.value]?.children || []),
            // id: "configForm" + Date.now(), // update form id to force re-render
          },
        };
      });
    } else {
      setUsecaseChanged(false);
    }
  };

  const onFormSubmit = ({ formState }) => {
    console.log("submitted form state", formState);
  };

  createEffect(() => {
    console.log("onMount");
    loadUI("/form2.json?t=" + Date.now())
      .then((data) => {
        console.log("UI JSON loaded successfully", data);
        setUiJson(data);
      })
      .catch((error) => {
        console.error("Error loading UI JSON:", error);
      });

    return () => {
      console.log("onCleanup jsonform");
    };
  }, []);

  return (
    <div>
      <a href="/pug-compiler.html" target="_blank">
        Use PUG to Json compiler
      </a>
      <JsonForm
        key={instanceId}
        instanceId={instanceId}
        setRequestObj={() => {}}
        setIsFormValid={() => {}}
        uiJson={uiJson}
        onFormChange={onFormChange}
        onSubmit={onFormSubmit}
        usecaseChanged={usecaseChanged}
      />
      {/* <div>
        <Playground />
      </div>
      <template id="template">this is a template</template> */}
    </div>
  );
};
