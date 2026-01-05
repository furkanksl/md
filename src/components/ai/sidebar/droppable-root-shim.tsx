import { useSortable } from "@dnd-kit/sortable";
import { clsx } from "clsx";

export const DroppableRootShim = () => {
  const { setNodeRef, isOver } = useSortable({
    id: "root-droppable",
    data: { type: "root" },
  });
  return (
    <div
      ref={setNodeRef}
      className={clsx(
        "flex-1 min-h-[50px] transition-colors rounded-xl mt-2",
        isOver &&
          "bg-stone-50 dark:bg-stone-800 ring-1 ring-stone-200 dark:ring-stone-700 border-dashed border border-stone-300 dark:border-stone-600"
      )}
    />
  );
};
