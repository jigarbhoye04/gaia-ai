import { Metadata } from "next";

import Notes from "@/components/Notes/NotesPage";

export const metadata: Metadata = {
  title: "Notes",
};

export default function Page() {
  return <Notes />;
}
