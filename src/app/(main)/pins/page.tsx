import { Metadata } from "next";

import Pins from "@/components/Pins/PinsPage";

export const metadata: Metadata = {
  title: "Pinned Messages",
};

export default function Page() {
  return <Pins />;
}
