import { Button } from "@heroui/button";
// import { Spinner } from "@heroui/spinner";
import * as React from "react";
import { Loader } from "lucide-react";

import { VolumeHighIcon, VolumeOffIcon } from "../Misc/icons";

import api from "@/utils/apiaxios";

export default function TextToSpeech({ text }: { text: string }) {
  const [loading, setLoading] = React.useState(false);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [audio, setAudio] = React.useState<HTMLAudioElement | null>(null);

  const handleTextToSpeech = async () => {
    try {
      if (isPlaying || loading) {
        if (audio) {
          audio.pause();
          audio.src = "";
        }
        setAudio(null);
        setIsPlaying(false);
        setLoading(false);
      } else {
        setLoading(true);

        // API Call
        const response = await api.post(
          "/synthesize",
          { text },
          { responseType: "arraybuffer" },
        );

        // Convert audio data to a Blob
        const audioBlob = new Blob([response.data], { type: "audio/wav" });
        const audioUrl = URL.createObjectURL(audioBlob);

        // Create and play the audio
        const newAudio = new Audio(audioUrl);

        await newAudio.play();
        setAudio(newAudio);

        setIsPlaying(true);
        newAudio.onended = () => setIsPlaying(false);
      }
    } catch (error) {
      console.error("Error synthesizing speech:", error);
    } finally {
      setLoading(false);
    }
  };

  // Cleanup audio when component unmounts
  React.useEffect(() => {
    return () => {
      if (audio) {
        audio.pause();
        audio.src = "";
      }
    };
  }, [audio]);

  return (
    <Button
      isIconOnly
      className="w-fit p-0 h-fit rounded-md"
      disabled={loading || isPlaying}
      size="sm"
      style={{ minWidth: "22px" }}
      variant="light"
      onPress={handleTextToSpeech}
    >
      {loading ? (
        <Loader className="text-[#9b9b9b] animate-spin text-[24px]" />
      ) : isPlaying ? (
        <VolumeOffIcon className="text-[#9b9b9b] text-[18px]" />
      ) : (
        <VolumeHighIcon />
      )}
    </Button>
  );
}
