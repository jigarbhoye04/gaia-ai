import { Button } from "@heroui/button";

import { Github } from "../Misc/icons";

export default function MadeBy() {
  return (
    <div className="w-full flex justify-center pb-4">
      <Button
        className="font-medium lowercase pl-0 gap-1"
        color="primary"
        radius="full"
        size="sm"
        startContent={<Github color="lightgrey" height="20" />}
        variant="faded"
        onPress={() =>
          (window.location.href = "https://github.com/aryanranderiya")
        }
      >
        Made by Aryan Randeriya
      </Button>
    </div>
  );
}
