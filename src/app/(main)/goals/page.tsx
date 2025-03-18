import { Metadata } from "next";

import GoalsPage from "@/components/Goals/GoalsPage";

export const metadata: Metadata = {
  title: "Goals",
};

export default function Page() {
  return <GoalsPage />;
}
