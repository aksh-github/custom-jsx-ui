import { h, createState, createEffect } from "@vdom-lib";
import { isFormValid, loadUI, setGlobalUIJson, validate } from "./utils";

const ErrorMessage = ({ name, error }) => {
  return (
    <div>
      <div className="col-sm-2"></div>
      <p id={name + "Error"} className="message-invalid danger col-sm-10">
        {/* {error ? (
<Icon name="exclamation-triangle" className="sl-icon_color_error" />
) : null}
{" " + (error || "")} */}
        {error}
      </p>
    </div>
  );
};

const Field = (props) => {
  // console.log("field", field);
  let control;
  const { field, state } = props;

  switch (field.type) {
    case "text":
    case "email":
    case "password":
      control = (
        <div>
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
            value={state?.value ?? field.value ?? field.defaultValue ?? ""}
          />
        </div>
      );
      break;
    case "select":
      control = (
        <div>
          <label htmlFor={field.name} className="form-label">
            {field.label}
          </label>
          <select
            aria-label={field.label}
            className={"col-sm-101 " + field.className}
            id={field.id || field.name}
            name={field.name}
            // required={field.required}
            // defaultValue={field.value || state?.value}
            value={state?.value ?? field.value ?? field.defaultValue ?? ""}
          >
            {field.children.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      );
      break;
    case "checkbox":
      control = (
        <div>
          <input
            type="checkbox"
            className={field.className}
            id={field.id}
            name={field.name}
            required={field.required}
            // defaultValue={state?.value}
            checked={state?.value ?? field.value ?? field.defaultValue ?? false}
          />
          <label className="form-check-label" htmlFor={field.name}>
            {field.label}
          </label>
        </div>
      );
      break;
    case "textarea":
      control = (
        <div>
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
            value={state?.value ?? field.value ?? field.defaultValue ?? ""}
          ></textarea>
        </div>
      );
      break;
    default:
      control = null;
  }

  return control ? (
    <div className="mb-3">
      {control}
      <ErrorMessage
        name={field.name}
        // error={formState()?.[field.name]?.error}
        error={state?.error}
      />
    </div>
  ) : null;
};

const getInitialFieldValue = (field) => {
  return field.value ?? field.defaultValue ?? "";
};

const JsonForm = ({
  setIsFormValid,
  setRequestObj,
  uiJson,
  onFormChange,
  onSubmit,
  usecaseChanged,
}) => {
  // const [uiJson, setUiJson] = createState(null);
  const [formState, setFormState] = createState(null);
  const [formValid, setFormValid] = createState(false);

  let formRef;

  createEffect(() => {
    console.log("uiJson changed");
    if (uiJson) {
      const newState = uiJson.form?.children.reduce((acc, field) => {
        const existingField = formState?.[field.name];
        acc[field.name] = {
          value: existingField
            ? existingField.value
            : getInitialFieldValue(field),
          error: existingField?.error ?? field.error ?? "",
        };
        return acc;
      }, {});

      setFormState((prevState) =>
        usecaseChanged ? { ...newState } : { ...prevState, ...newState },
      );
      // setFormValid(isFormValid(initialState));

      setGlobalUIJson(uiJson);
    }
  }, [uiJson]);

  createEffect(() => {
    if (!formState || !uiJson) {
      return;
    }

    setFormValid(isFormValid(formState));
  }, [uiJson, formState]);

  const validateForm = () => {
    // console.log("validateForm", formState);
    // const errors = {};
    let isValid = true;

    for (const fieldName in formState) {
      const field = formState[fieldName];
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
      console.log("Form submitted successfully");
      onSubmit?.({
        formState,
        // uiJson,  // dont think we need this
      });
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

      setTimeout(() => {
        // setIsFormValid(isFormValid(newState));
        onFormChange?.(newState, { name, value: fieldVal, error: err });

        // const isValid = isFormValid(newState);
        // setFormValid(isValid);
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

      // setTimeout(() => {
      //   // setIsFormValid(isFormValid(newState));
      //   console.log(isFormValid(newState));
      // }, 0);

      return newState;
    });
  };

  return (
    <div>
      <h1>Json Based Form</h1>
      <p>JsonForm valid: {formValid ? "true" : "false"}</p>
      {uiJson && formState && (
        <form
          id={uiJson.form.id}
          // ref={(el) => {
          //   formRef = el;

          //   // console.log("el", el);
          //   el = null;
          // }}
          className={uiJson.form.className}
          onBlur={(e) => {
            const { name, value, type, checked } = e.target;

            if (type === "submit") {
              // return when submit button is blurred to avoid validating form on submit button click
              return;
            }

            if (type === "checkbox") {
              setError(name, validate(name, checked));
            } else {
              setError(name, validate(name, value));
            }
          }}
          onChange={handleChange}
          onSubmit={handleSubmit}
        >
          {uiJson.form.children.map((field, idx) => (
            <Field
              key={field.name}
              field={field}
              state={formState[field.name]}
            />
          ))}
          <button type="submit">Submit</button>
        </form>
      )}
      <pre>{JSON.stringify(formState, null, 2)}</pre>
    </div>
  );
};

export default JsonForm;
