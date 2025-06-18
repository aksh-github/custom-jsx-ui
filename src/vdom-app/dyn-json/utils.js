export const loadUI = async (url) => {
  try {
    const response = await fetch(url);
    const data = await response.json();

    uiJson = data;

    return data;
  } catch (error) {
    console.error("Error loading UI JSON:", error);
    return null;
  }
};

let uiJson = null;

export const setGlobalUIJson = (data) => {
  uiJson = data;
};

export const validate = (name, value) => {
  if (!uiJson || !uiJson.form || !uiJson.form.fields) {
    console.error("UI JSON not loaded yet");
    return "";
  }

  const field = uiJson.form.fields.find((f) => f.name === name);
  if (!field) {
    console.error("Field not found in UI JSON:", name);
    return "";
  }

  const { validation } = field;

  // const validation = {
  //   username: {
  //     required: true,
  //     minLength: 3,
  //     maxLength: 16,
  //     pattern: /^[A-Za-z0-9]+$/,
  //   },
  //   email: {
  //     required: true,
  //     pattern:
  //       /^([a-zA-Z0-9_.-])+@([a-zA-Z0-9-])+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,4}$/,
  //   },
  //   password: {
  //     required: true,
  //     minLength: 8,
  //     maxLength: 20,
  //     pattern:
  //       /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,20}$/,
  //   },
  // };

  if (!validation) {
    return "";
  }

  let error = "";
  if (validation.required && !value) {
    error = `Please enter Field`;
  } else if (value.length < validation.minLength) {
    error = `Field should be at least ${validation.minLength} characters`;
  } else if (value.length > validation.maxLength) {
    error = `Field should be at most ${validation.maxLength} characters`;
  } else if (validation.pattern) {
    const regex = new RegExp(validation.pattern);
    if (!regex.test(value)) {
      error = `Field does not match the required pattern`;
    }
  }

  return error;
};

export const isFormValid = (formState) => {
  if (!uiJson || !formState) {
    console.error("UI JSON or form state not loaded yet");
    return false;
  }

  let isValid = true;
  for (const fieldName in formState) {
    const field = formState[fieldName];
    const { value } = field;
    const error = validate(fieldName, value);
    if (error) {
      isValid = false;
      break; // Stop on first error
    }
  }
  return isValid;
};
