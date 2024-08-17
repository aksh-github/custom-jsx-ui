export const SimpleSwitch = () => {
  return (props) => {
    // console.log(props);
    const { cond, children } = props;

    let defaultc = null;

    const selected = children?.find((c) => {
      const { value } = c;
      console.log(cond);
      if (value.when === undefined) defaultc = c;
      return value.when === cond;
    });

    return (selected || defaultc)?.value?.render;
  };
};

SimpleSwitch.Case = () => {
  return (props) => {
    const { when, render } = props;
    return { render: render, when: when };
  };
};
