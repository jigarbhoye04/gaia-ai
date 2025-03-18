import Notes from "@/components/Notes/NotesPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notes",
};

export default function Page() {
  return <Notes />;
}
