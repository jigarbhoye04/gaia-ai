import { Metadata } from "next";

import MailsPage from "@/components/Mail/MailsPage";

export const metadata: Metadata = {
  title: "Mail",
};

export default function Page() {
  return <MailsPage />;
}
