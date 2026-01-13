/** @jsx h */
import { h, createState } from "./vdom-lib";

/**
 * A reusable virtual list component.
 *
 * @param {{
 * items: any[];
 * renderItem: (item: any, index: number) => JSX.Element;
 * itemHeight: number;
 * windowHeight: number;
 * overscan?: number;
 * }} props
 */
export const VirtualList = ({
  items,
  renderItem,
  itemHeight,
  windowHeight,
  overscan = 20,
}) => {
  const [scrollTop, setScrollTop] = createState(0);

  const handleScroll = (e) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + windowHeight) / itemHeight) + overscan
  );

  const getRowToRender = () => {
    const rows = [];
    for (let i = startIndex; i < endIndex; i++) {
      rows.push(
        <div
          key={i}
          style={{
            position: "absolute",
            transform: `translateY(${i * itemHeight}px)`,
            width: "100%",
            height: `${itemHeight}px`,
          }}
        >
          {renderItem(items[i], i)}
        </div>
      );
    }
    return rows;
  };
  // , [startIndex, endIndex, items, renderItem, itemHeight]);

  return (
    <div
      style={{
        height: `${windowHeight}px`,
        overflowY: "auto",
        position: "relative",
      }}
      onScroll={handleScroll}
    >
      <div
        style={{
          height: `${items.length * itemHeight}px`,
          position: "relative",
        }}
      >
        {getRowToRender()}
      </div>
    </div>
  );
};
