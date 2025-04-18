"use client";

import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import Link from "next/link";
import { useEffect, useState } from "react";

import { StickyNote01Icon } from "@/components/Misc/icons";
import NoteCard from "@/components/Notes/NoteCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiauth } from "@/utils/apiaxios";

export interface Note {
  id: string;
  // title?: string;
  // description?: string;
  content: string;
  auto_created?: boolean;
  plaintext: string;
}

export default function Notes() {
  // const [openDialog, setOpenDialog] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const response = await apiauth.get("/notes");

      setNotes(response?.data || []);
    } catch (error) {
      console.error("Error fetching notes:", error);
    } finally {
      setLoading(false);
    }
  };

  // Delete a note
  const deleteNote = async (id: string) => {
    try {
      await apiauth.delete(`/notes/${id}`);
      setNotes((prevNotes) => prevNotes.filter((note) => note.id !== id));
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

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
                    <NoteCard key={index} note={note} onDelete={deleteNote} />
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
              variant="shadow-sm"
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
