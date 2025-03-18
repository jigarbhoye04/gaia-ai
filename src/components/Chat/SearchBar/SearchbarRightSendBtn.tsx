import { Button } from "@heroui/button";
import { Tooltip } from "@heroui/tooltip";

import { SentIcon } from "../../Misc/icons";
import AnimatedAudioTranscription from "../../Audio/AnimatedAudioTranscription";
// import MicrophoneBtn from "../Audio/MicrophoneBtn";

export default function SearchbarRightSendBtn({
  loading,
  setSearchbarText,
  searchbarText,
  handleFormSubmit,
}: {
  loading: boolean;
  searchbarText: string;
  setSearchbarText: any;
  handleFormSubmit: any;
}) {
  return (
    <div className="ml-2 flex items-center gap-1">
      <AnimatedAudioTranscription
        handleFormSubmit={handleFormSubmit}
        setTranscription={setSearchbarText}
        transcription={searchbarText}
      />

      <Tooltip content="Send message" placement="right">
        <Button
          isIconOnly
          aria-label="Send message"
          className={`${loading && "cursor-wait"}`}
          color="primary"
          disabled={loading}
          isLoading={loading}
          radius="full"
          type="submit"
        >
          <SentIcon color="black" />
        </Button>
      </Tooltip>
    </div>
  );
}
