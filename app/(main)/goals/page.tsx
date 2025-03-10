import GoalsPage from "@/components/Goals/GoalsPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Goals",
};

export default function Page() {
  return <GoalsPage />;
}
