import { createState, h } from "@vdom-lib";
import { data } from "./data.js";

export const Column = ({
  column,
  onDrop,
  onDragOver,
  columns,
  onDragStart,
  onDragEnd,
  onCreateNewItem,
}) => {
  return (
    <section
      key={column}
      className="column"
      onDrop={(event) => onDrop(event, column)}
      onDragOver={onDragOver}
    >
      <section>
        <h2>
          <span className="heading">{column}</span>
          <span className="count">({columns[column].length})</span>
        </h2>
        {/* <form
          className="new-item-input-form"
          onSubmit={(event) => onCreateNewItem(event, column)}
        >
          <input
            placeholder="Add new item"
            name={column}
            className="new-item-input"
          />
        </form> */}
        <ul className="list-parent">
          {columns[column].map((item, index) => (
            <li
              onClick={() => console.log("item clicked", item)}
              key={item}
              draggable
              onDragStart={(event) => onDragStart(event, item, column, index)}
              className="item"
              onDragOver={onDragOver}
              onDrop={(event) => onDrop(event, column, index)}
              data-key={item}
              onDragEnd={onDragEnd}
            >
              {item}: {data.find((d) => d.id === item)?.summary || ""}
              <hr />
              {data.find((d) => d.id === item)?.description.substring(0, 100) +
                "..." || ""}
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
};
