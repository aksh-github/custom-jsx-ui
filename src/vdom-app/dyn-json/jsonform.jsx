// import React, { useEffect, useState } from "react";
import { atom, createEffect, state } from "../../utils/simple-state";
import { h, onMount, df } from "../../utils/vdom/vdom-lib";
import { isFormValid, loadUI, setGlobalUIJson, validate } from "./utils";

const Playground = () => {
  const [json, setJson] = atom(null);
  const [parseResult, setParseResult] = atom(null);

  const effect = createEffect();

  return () => {
    // effect(() => {
    //   try {
    //     setParseResult(JSON.parse(json()));
    //   } catch (error) {
    //     setParseResult(error);
    //   }
    // }, [json()]);

    return (
      <df>
        <h1>Playground</h1>
        <div className="pg-container" style={{ display: "flex" }}>
          <div>
            <textarea
              name=""
              id=""
              onInput={(e) => {
                setJson(JSON.parse(e.target.value));
                console.log(e.target.value);
              }}
            ></textarea>
          </div>
          {/* <div>{JSON.stringify(json())}</div> */}
          <div>
            {json()?.form?.fields.map((field, idx) => (
              <Field
                // key={field.name + idx + field.name}
                field={field}
                state={field}
              />
            ))}
          </div>
        </div>
        <pre>
          <code>{parseResult()}</code>
        </pre>
      </df>
    );
  };
};

const ErrorMessage = ({ name, error }) => {
  return ({ name, error }) => (
    <df>
      <div className="col-sm-2"></div>
      <p id={name + "Error"} className="message-invalid danger col-sm-10">
        {/* {error ? (
<Icon name="exclamation-triangle" className="sl-icon_color_error" />
) : null}
{" " + (error || "")} */}
        {error}
      </p>
    </df>
  );
};

const Field = (props) => {
  return (props) => {
    // console.log("field", field);
    let control;
    const { field, state } = props;

    switch (field.type) {
      case "text":
      case "email":
      case "password":
        control = (
          <df>
            <label htmlFor={field.name} className="form-label">
              {field.label}
            </label>
            <input
              type={field.type}
              className={"col-sm-10 " + field.className}
              id={field.id}
              name={field.name}
              placeholder={field.placeholder || ""}
              required={field.required}
              value={field.value || state?.value || ""}
            />
          </df>
        );
        break;
      case "select":
        control = (
          <df>
            <label htmlFor={field.name} className="form-label">
              {field.label}
            </label>
            <select
              aria-label={field.label}
              className={"col-sm-101 " + field.className}
              id={field.id || field.name}
              name={field.name}
              required={field.required}
              // defaultValue={field.value || state?.value}
              value={field.value || state?.value || ""}
            >
              {field.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </df>
        );
        break;
      case "checkbox":
        control = (
          <df>
            <input
              type="checkbox"
              className={field.className}
              id={field.id}
              name={field.name}
              required={field.required}
              // defaultValue={state?.value}
              checked={field.value || state?.value || false}
            />
            <label className="form-check-label" htmlFor={field.name}>
              {field.label}
            </label>
          </df>
        );
        break;
      case "textarea":
        control = (
          <df>
            <label htmlFor={field.name} className="form-label">
              {field.label}
            </label>
            <textarea
              className={"col-sm-10 " + field.className}
              id={field.id}
              name={field.name}
              placeholder={field.placeholder || ""}
              required={field.required}
              rows={field.rows}
              cols={field.cols}
              value={field.value || state?.value || ""}
            ></textarea>
          </df>
        );
        break;
      default:
        control = null;
    }

    return control ? (
      <div className="mb-3" key={field.name}>
        {control}
        <ErrorMessage
          name={field.name}
          // error={formState()?.[field.name]?.error}
          error={state?.error}
        />
      </div>
    ) : null;
  };
};

const JsonForm = ({ setIsFormValid, setRequestObj }) => {
  const [uiJson, setUiJson] = atom(null);
  const [formState, setFormState] = atom(null);

  onMount(() => {
    loadUI("/form.json?t=" + Date.now())
      .then((data) => {
        console.log("UI JSON loaded successfully", data);
        setUiJson(data);
      })
      .catch((error) => {
        console.error("Error loading UI JSON:", error);
      });
  });

  const effect = createEffect();

  const [formValid, setFormValid] = atom(false);

  const validateForm = () => {
    // console.log("validateForm", formState());
    // const errors = {};
    let isValid = true;

    for (const fieldName in formState()) {
      const field = formState()[fieldName];
      const { value } = field;
      const error = validate(fieldName, value);
      if (error) {
        // errors[fieldName] = error;
        isValid = false;

        setFormValid(false);
        // break; // Stop on first error

        setFormState((prevState) => {
          // console.log("prevState", prevState);

          return {
            ...prevState,
            [fieldName]: {
              value: prevState[fieldName].value,
              error,
            },
          };
        });
      } else {
        setFormState((prevState) => {
          // console.log("prevState", prevState);

          return {
            ...prevState,
            [fieldName]: {
              value: prevState[fieldName].value,
              error: "",
            },
          };
        });
      }
    }

    // console.log("errors", errors);

    if (isValid) {
      setFormValid(true);
    }

    // return { isValid, errors };
    return isValid;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    // console.log("formState()", formState());
    // validateForm();
    const isValid = validateForm();
    // console.log("isValid", isValid);
    if (isValid) {
      // Submit the form
      console.log("Form submitted successfully");
    } else {
      console.log("Form submission failed");
    }
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    const fieldVal = type === "checkbox" ? checked : value;

    setFormState((prevState) => {
      const err = validate(name, fieldVal);
      const newState = {
        ...prevState,
        [name]: {
          value: fieldVal,
          error: err,
        },
      };

      if (name === "selectUsecase") {
        // modify the form json based on the selected use case

        setUiJson((prevUiJson) => {
          return {
            ...prevUiJson,
            form: {
              ...prevUiJson.form,
              fields: uiJson()
                .form.fields // .filter((field, idx) => idx === 0)
                .filter((field) => field.name === "selectUsecase")
                .concat(uiJson().form.more[value]?.fields || []),
              id: "configForm" + Date.now(), // update form id to force re-render
            },
          };
        });
      }

      // if no save button, then need to have setTimeout
      setTimeout(() => {
        // console.log("newState", newState);

        const isValid = isFormValid(newState);
        let reqObj = {};

        if (isValid) {
          const { fields } = uiJson().form;
          Object.keys(fields).forEach((idx) => {
            // console.log("field", idx, fields[idx]);

            if (fields[idx].requestObjName)
              reqObj[fields[idx].requestObjName] =
                newState[fields[idx].name]?.value;
          });

          console.log("Form is valid now... Request Object", reqObj);
          // setRequestObj(reqObj);
        }
        // setIsFormValid(isValid);
      }, 0);

      return newState;
    });
  };

  const setError = (id, error) => {
    let newState;

    setFormState((prevState) => {
      newState = {
        ...prevState,
        [id]: {
          value: prevState[id].value,
          error,
        },
      };

      setTimeout(() => {
        // setIsFormValid(isFormValid(newState));
        console.log(isFormValid(newState));
      }, 0);

      return newState;
    });
  };

  return () => {
    effect(() => {
      if (uiJson()) {
        setFormState(
          uiJson().form.fields.reduce((acc, field) => {
            acc[field.name] = {
              value: formState()?.[field.name]?.value || field.value || "",
              error: formState()?.[field.name]?.error || field.error || "",
            };
            return acc;
          }, {})
        );

        setGlobalUIJson(uiJson());
      }
    }, [uiJson()]);

    return (
      <div>
        <h1>Json Based Form</h1>
        <p>JsonForm valid: {isFormValid(formState()) ? "true" : "false"}</p>
        {uiJson() && formState() && (
          <form
            id={uiJson().form.id}
            className={uiJson().form.className}
            onBlur={(e) => {
              const { name, value, type, checked } = e.target;
              if (type === "checkbox") {
                setError(name, validate(name, checked));
              } else {
                setError(name, validate(name, value));
              }
            }}
            onChange={handleChange}
            onSubmit={handleSubmit}
          >
            {uiJson().form.fields.map((field, idx) => (
              <Field
                // key={field.name + idx + field.name}
                field={field}
                state={formState()[field.name] || field}
              />
            ))}
          </form>
        )}
        <pre>{JSON.stringify(formState(), null, 2)}</pre>
        <div>
          <Playground />
        </div>
      </div>
    );
  };
};

export default JsonForm;
