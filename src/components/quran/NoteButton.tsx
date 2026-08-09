
import { useState } from "react";
import { NotebookPen } from "lucide-react";
import { getNotes, noteId, saveNote, type Note } from "@/lib/storage";
import { useLocalStore } from "./use-local-store";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function NoteButton({
  surah,
  surahName,
  ayah,
  text,
  className,
}: {
  surah: number;
  surahName?: string;
  ayah: number;
  text?: string;
  className?: string;
}) {
  const notes = useLocalStore<Note[]>(getNotes, []);
  const existing = notes.find((n) => n.id === noteId(surah, ayah));
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) setBody(existing?.body ?? "");
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={existing ? "تعديل الملاحظة" : "إضافة ملاحظة"}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "grid size-7 shrink-0 place-items-center rounded-full transition-all duration-200 hover:scale-110 active:scale-90",
            existing ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
            className,
          )}
        >
          <NotebookPen className="size-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">
            ملاحظة على {surahName ? `${surahName} · ` : ""}الآية {ayah}
          </DialogTitle>
        </DialogHeader>
        {text ? <p className="font-quran text-base leading-8 text-muted-foreground">{text}</p> : null}
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          placeholder="اكتب تدبّرك أو ملاحظتك هنا…"
        />
        <DialogFooter className="gap-2 sm:justify-start">
          <Button
            onClick={() => {
              saveNote({ surah, surahName, ayah, text: text ?? "", body });
              setOpen(false);
            }}
          >
            حفظ
          </Button>
          {existing ? (
            <Button
              variant="secondary"
              onClick={() => {
                saveNote({ surah, surahName, ayah, text: text ?? "", body: "" });
                setOpen(false);
              }}
            >
              حذف
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


