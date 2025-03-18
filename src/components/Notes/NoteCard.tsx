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
        className="w-full bg-zinc-800 hover:bg-zinc-700 transition-all max-h-[250px] rounded-xl text-foreground flex p-[1em] flex-col justify-start overflow-hidden gap-1 cursor-pointer h-full relative "
      // onClick={() => setOpenDialog(true)} // Open dialog on click
      >
        {note.auto_created && (
          <Chip className="mb-1" color="primary" size="sm" variant="flat">
            Auto Created by GAIA
          </Chip>
        )}
        {/* <div className="absolute rotate-[-90deg] top-[-3px] -right-2 shadow-sm">
          <TriangleRight
            height={45}
            width={45}
            fill="#ffffff50"
            color="transparent"
          />
        </div> */}
        <div className="font-normal text-md whitespace-wrap overflow-hidden overflow-ellipsis min-h-7 max-h-[100px]">
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
