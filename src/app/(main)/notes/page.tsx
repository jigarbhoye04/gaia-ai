import { Metadata } from "next";

import Notes from "@/features/notes/components/NotesPage";

export const metadata: Metadata = {
  title: "notes",
};

export default function Page() {
  return <Notes />;
}
