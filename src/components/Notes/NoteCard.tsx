import { Chip } from "@heroui/chip";
import Link from "next/link";

import { NoteType } from "@/types/allTypes";

export default function NoteCard({
  note,
}: // onDelete,
{
  note: NoteType;
  onDelete?: (id: string) => void;
}) {
  // const [openDialog, setOpenDialog] = useState(false);

  return (
    <Link className="w-full px-1" href={`/notes/${note.id}`}>
      <div
        className="relative flex h-full max-h-[250px] w-full cursor-pointer flex-col justify-start gap-1 overflow-hidden rounded-xl bg-zinc-800 p-[1em] text-foreground transition-all hover:bg-zinc-700"
        // onClick={() => setOpenDialog(true)} // Open dialog on click
      >
        {note.auto_created && (
          <Chip className="mb-1" color="primary" size="sm" variant="flat">
            Auto Created by GAIA
          </Chip>
        )}
        {/* <div className="absolute rotate-[-90deg] top-[-3px] -right-2 shadow-xs">
          <TriangleRight
            height={45}
            width={45}
            fill="#ffffff50"
            color="transparent"
          />
        </div> */}
        <div className="text-md whitespace-wrap max-h-[100px] min-h-7 overflow-hidden font-normal text-ellipsis">
          {note.plaintext}
        </div>

        {/* <ScrollArea>
        <span className="text-md">{note.note}</span>
      </ScrollArea> */}
      </div>

      {/* Note Dialog */}
      {/* <NoteDialog
        openDialog={openDialog}
        setOpenDialog={setOpenDialog}
        note={note}
        onDelete={() => onDelete(note.id)} // Pass delete handler
      /> */}
    </Link>
  );
}
