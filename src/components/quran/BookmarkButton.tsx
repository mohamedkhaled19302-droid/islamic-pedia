
import { Bookmark as BookmarkIcon } from "lucide-react";
import { bookmarkId, getBookmarks, toggleBookmark, type Bookmark } from "@/lib/storage";
import { useLocalStore } from "./use-local-store";
import { cn } from "@/lib/utils";

export function BookmarkButton({
  item,
  className,
}: {
  item: Omit<Bookmark, "id" | "at">;
  className?: string;
}) {
  const list = useLocalStore<Bookmark[]>(getBookmarks, []);
  const saved = list.some((b) => b.id === bookmarkId(item));

  return (
    <button
      type="button"
      aria-label={saved ? "إزالة العلامة" : "إضافة علامة"}
      aria-pressed={saved}
      onClick={(e) => {
        e.stopPropagation();
        toggleBookmark(item);
      }}
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-full transition-all duration-200 hover:scale-110 active:scale-90",
        saved ? "bg-gold-gradient text-gold-foreground" : "bg-secondary text-muted-foreground",
        className,
      )}
    >
      <BookmarkIcon className={cn("size-3.5", saved && "fill-current")} />
    </button>
  );
}


