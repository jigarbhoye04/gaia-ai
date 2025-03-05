import { Button } from "@heroui/button";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function NotLoggedIn() {
  return (
    <Dialog open={false}>
      <DialogContent className="bg-zinc-900 text-white border-none flex flex-col gap-3 md:rounded-2xl rounded-2xl max-w-[350px]">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl  select-text">
            Log in
          </DialogTitle>
          <DialogDescription className="text-center select-text text-sm">
            You have been Signed out.
            <br />
            Please login again to use GAIA!
          </DialogDescription>
        </DialogHeader>

        <Button color="primary" size="md" variant="flat" onClick={() => {}}>
          Login
        </Button>
      </DialogContent>
    </Dialog>
  );
}
