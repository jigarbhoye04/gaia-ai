"use client";

import { Button } from "@heroui/button";
import Link from "next/link";
import { useEffect } from "react";

import { StickyNote01Icon } from "@/components/shared/icons";
import { ScrollArea } from "@/components/ui/shadcn/scroll-area";
import Spinner from "@/components/ui/shadcn/spinner";
import NoteCard from "@/features/notes/components/NoteCard";
import { useNotes } from "@/features/notes/hooks/useNotes";

export default function Notes() {
  const { notes, loading, fetchNotes, deleteNote } = useNotes();

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleDeleteNote = async (id: string) => {
    try {
      await deleteNote(id);
    } catch (error) {
      // Error is already handled in the hook
      console.error(error);
    }
  };

  return (
    <>
      <div className="flex h-full flex-col justify-between">
        <ScrollArea>
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-center text-5xl font-bold">Notes</h1>
            <div className="text-md max-w-(--breakpoint-md) pb-6 text-center">
              Add and store custom notes as memories for your AI assistant,
              enabling it to recall important details and provide more
              personalized interactions over time.
            </div>
          </div>

          {loading ? (
            <div className="flex h-[80vh] items-center justify-center">
              <Spinner />
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-4 pb-8 sm:px-[10vw]">
              <div className="grid grid-cols-1 gap-4 pb-24 sm:grid-cols-3 sm:pb-20">
                {notes.length > 0 &&
                  notes?.map((note, index) => (
                    <NoteCard
                      key={index}
                      note={note}
                      onDelete={() => handleDeleteNote(note.id)}
                    />
                  ))}
              </div>
            </div>
          )}
        </ScrollArea>

        <div className="absolute bottom-4 left-0 z-10 flex w-full items-center justify-center">
          <Link href={"/notes/new"}>
            <Button
              className="gap-1 font-semibold"
              color="primary"
              radius="full"
              size="lg"
              variant="shadow"
            >
              <StickyNote01Icon color="black" height={27} width={27} />
              Add Note
            </Button>
          </Link>
        </div>
        <div className="bg-custom-gradient2 absolute bottom-0 left-0 z-1 h-[100px] w-full" />
      </div>
      {/* <AddNoteDialog
        openDialog={openDialog}
        setOpenDialog={setOpenDialog}
        addNote={addNote}
      /> */}
    </>
  );
}
