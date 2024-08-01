export const SimpleSwitch = () => {
  return (props) => {
    // console.log(props);
    const { cond, children } = props;

    const selected = children?.find((c) => {
      const { value } = c;
      return value.when === cond;
    });

    return selected?.value?.render;
  };
};

SimpleSwitch.Case = () => {
  return (props) => {
    const { when, render } = props;
    return { render: render, when: when };
  };
};
