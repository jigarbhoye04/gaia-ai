import MailsPage from "@/components/Mail/MailsPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mail",
};

export default function Page() {
  return <MailsPage category="important" title="Important" />;
}
