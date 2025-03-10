import Pins from "@/components/Pins/PinsPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pinned Messages",
};

export default function Page() {
  return <Pins />;
}
