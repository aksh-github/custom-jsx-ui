import JsonForm from "./jsonform";
import { h, createEffect, createState } from "../../utils/vdom/vdom-lib";
import { loadUI } from "./utils";

export const JsonFormConsumer = () => {
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
            children: uiJson.form.children // .filter((field, idx) => idx === 0)
              .filter((field) => field.name === "selectUsecase")
              .concat(uiJson.form.more[currrentValue.value]?.children || []),
            // id: "configForm" + Date.now(), // update form id to force re-render
          },
        };
      });
    } else {
      setUsecaseChanged(false);
    }
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
    <JsonForm
      setRequestObj={() => {}}
      setIsFormValid={() => {}}
      uiJson={uiJson}
      onFormChange={onFormChange}
      usecaseChanged={usecaseChanged}
    />
  );
};
