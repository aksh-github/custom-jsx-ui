import { createState, createEffect, h } from "@vdom-lib";
import { Column } from "./Column";
import "./dnd.css";

export function DragDrop() {
  const [columns, setColumns] = createState({
    ToDo: ["a-10001", "b-10002"],

    InProgress: ["c-10003"],
  });

  createEffect(() => {
    console.log("Columns updated:", columns);
  }, [columns]);

  const swapItems = (prev, fromColumn, fromIndex, toColumn, toIndex) => {
    // Create deep copies of the arrays to ensure immutability
    const fromData = [...prev[fromColumn]];
    const toData = [...prev[toColumn]];

    if (fromColumn === toColumn) {
      // FIX: If source and destination are the same, perform a MOVE operation.
      // 1. Create a single copy of the array.
      const newArray = [...fromData];
      // 2. Remove the item from its original index.
      const [item] = newArray.splice(fromIndex, 1);
      // 3. Calculate the effective target index, adjusting for removal.
      const effectiveToIndex =
        Math.min(fromIndex, toIndex) === fromIndex ? toIndex - 1 : toIndex;
      // 4. Insert the item at the effective target index.
      newArray.splice(effectiveToIndex, 0, item);

      return {
        ...prev,
        [fromColumn]: newArray,
      };
    } else {
      // Move item from A to B (This logic was already correct)
      const [item] = fromData.splice(fromIndex, 1);
      toData.splice(toIndex, 0, item);

      // Return the new state object
      return {
        ...prev,
        [fromColumn]: fromData,
        [toColumn]: toData,
      };
    }
  };

  const onDrop = (event, toColumn, toIndex) => {
    event.stopPropagation();
    const item = event.dataTransfer.getData("item");
    const fromColumn = event.dataTransfer.getData("fromColumn");
    const fromIndex = parseInt(event.dataTransfer.getData("fromIndex"), 10);

    //animation
    event.target.classList.add("dropping");
    setTimeout(() => {
      event.target.classList.remove("dropping");
    }, 200);

    if (typeof toIndex !== "number") {
      // Drop on column, append to end and remove from original column
      setColumns((prev) => {
        const newColumns = { ...prev };
        newColumns[toColumn] = [...newColumns[toColumn], item];
        newColumns[fromColumn] = newColumns[fromColumn].filter(
          (_, i) => i !== fromIndex,
        );
        return newColumns;
      });
    } else {
      // swap if same column or swapping from another column
      setColumns((prev) => {
        return swapItems(prev, fromColumn, fromIndex, toColumn, toIndex);
      });
    }
  };

  const onDragOver = (event) => {
    event.preventDefault();
  };

  const onDragEnd = (event) => {
    // event.target.classList.remove("dragging");
    // console.log(columns);
  };

  const onDragStart = (event, item, fromColumn, fromIndex) => {
    event.dataTransfer.setData("item", item);
    event.dataTransfer.setData("fromColumn", fromColumn);
    event.dataTransfer.setData("fromIndex", fromIndex);
    // event.target.classList.add("dragging");
  };

  const onCreateNewItem = (event, column) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target));
    setColumns((prev) => ({
      ...prev,
      [column]: [...prev[column], data[column]],
    }));
    event.target.reset();
  };

  const createColumn = () => {
    const totalColumns = Object.keys(columns).length;
    const newColumnName = `column${totalColumns + 1}`;
    setColumns((prev) => ({
      ...prev,
      [newColumnName]: [],
    }));
  };

  return (
    <main>
      <div className="board">
        <div className="columns">
          {Object.keys(columns).map((column) => (
            <Column
              key={column}
              {...{
                column,
                onDrop,
                onDragOver,
                columns,
                onDragStart,
                onDragEnd,
                onCreateNewItem,
              }}
            />
          ))}
        </div>
        <button onClick={createColumn} className="add-column-btn">
          + Add Column
        </button>
      </div>
    </main>
  );
}
