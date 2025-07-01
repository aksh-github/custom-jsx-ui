import { createEffect, createState } from "../../utils/simple-state";
import JsonForm from "./jsonform";
import { h } from "../../utils/vdom/vdom-lib";
import { loadUI } from "./utils";

export const JsonFormConsumer = () => {
  const [uiJson, setUiJson] = createState(null);

  // vv imp func: this is all business logic
  const onFormChange = (formData, currrentValue) => {
    if (currrentValue?.name === "selectUsecase") {
      // modify the form json based on the selected use case
      setUiJson((prevUiJson) => {
        return {
          ...prevUiJson,
          form: {
            ...prevUiJson.form,
            fields: uiJson.form.fields // .filter((field, idx) => idx === 0)
              .filter((field) => field.name === "selectUsecase")
              .concat(uiJson.form.more[currrentValue.value]?.fields || []),
            id: "configForm" + Date.now(), // update form id to force re-render
          },
        };
      });
    }
  };

  createEffect(() => {
    console.log("onMount");
    loadUI("/form.json?t=" + Date.now())
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
    <JsonForm
      setRequestObj={() => {}}
      setIsFormValid={() => {}}
      uiJson={uiJson}
      onFormChange={onFormChange}
    />
  );
};
