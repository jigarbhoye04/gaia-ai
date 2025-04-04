import { AiBrowserIcon } from "../icons";

export default function BrowserHeader() {
  return (
    <>
      <div className="flex w-full items-center">
        <div className="flex items-center justify-center">
          <AiBrowserIcon className="mr-2 h-6 w-6 text-primary" />
          <h1 className="text-lg font-medium">Browser Automation</h1>
        </div>
      </div>
    </>
  );
}
