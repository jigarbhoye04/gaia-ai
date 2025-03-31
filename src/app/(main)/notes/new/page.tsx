import Notes from "@/components/Notes/NotesPage";
import { Metadata } from "next";
import NotesAdd from "../[id]/page";

export const metadata: Metadata = {
  title: "New Note",
};

export default function NewNotePage() {
  return <NotesAdd />;
}
