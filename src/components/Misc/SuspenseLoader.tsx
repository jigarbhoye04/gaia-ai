import { Loader } from "lucide-react";
export default function SuspenseLoader({
  fullHeight = false,
  fullWidth = false,
}: {
  fullHeight?: boolean;
  fullWidth?: boolean;
}) {
  return (
    <div
      className={`w-full ${fullHeight ? "h-screen" : "h-full"} ${
        fullWidth ? "w-screen" : "w-full"
      } flex items-center justify-center p-3`}
    >
      <Loader className="animate-spin text-primary" height={30} width={30} />
      {/* <Spinner size="lg" color="primary" /> */}
    </div>
  );
}
