"use client";

import { Button } from "@heroui/button";
import { Textarea } from "@heroui/input";
import { Tooltip } from "@heroui/tooltip";
import { AnimatePresence } from "framer-motion";
import { Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Mic02Icon } from "../Misc/icons";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AnimatedAudioTranscriptionProps {
  transcription: string;
  setTranscription: (text: string) => void;
  handleFormSubmit: () => void;
}

export default function AnimatedAudioTranscription({
  transcription,
  setTranscription,
  handleFormSubmit,
}: AnimatedAudioTranscriptionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);

  useEffect(() => {
    if (isOpen) {
      startRecording();
      wsRef.current = new WebSocket("ws://localhost:8000/api/v1/transcribe");
      wsRef.current.onmessage = (event) => setTranscription(event.data.trim());
      wsRef.current.onerror = () =>
        setError("Connection error. Please try again.");
      wsRef.current.onclose = () => console.log("WebSocket connection closed");
    }

    return () => {
      stopRecording();
      wsRef.current?.close();
    };
  }, [isOpen, setTranscription]);

  const startRecording = async () => {
    setError(null);
    setTranscription("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Your browser does not support audio recording.");

      return;
    }

    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 16000, channelCount: 1 },
      });

      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      sourceNodeRef.current = audioContextRef.current.createMediaStreamSource(
        streamRef.current,
      );

      processorRef.current = audioContextRef.current.createScriptProcessor(
        4096,
        1,
        1,
      );
      processorRef.current.onaudioprocess = (e) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const audioData = e.inputBuffer.getChannelData(0);
          const intData = new Int16Array(audioData.length);

          for (let i = 0; i < audioData.length; i++) {
            intData[i] = Math.max(-1, Math.min(1, audioData[i])) * 0x7fff;
          }
          wsRef.current.send(intData.buffer);
        }
      };

      sourceNodeRef.current.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);
    } catch (err) {
      setError("Error accessing microphone. Please check your settings.");
    }
  };

  const stopRecording = () => {
    processorRef.current?.disconnect();
    processorRef.current = null;
    sourceNodeRef.current?.disconnect();
    sourceNodeRef.current = null;
    audioContextRef.current?.close();
    audioContextRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const handleSend = () => {
    setTranscription("");
    setIsOpen(false);
    stopRecording();
    handleFormSubmit();
  };

  const handleCancel = () => {
    setTranscription("");
    stopRecording();
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Tooltip content="Record Voice" placement="top">
          <Button
            isIconOnly
            aria-label="Record voice message"
            className="mr-1"
            color="default"
            radius="full"
            type="button"
            variant="faded"
            onPress={() => setIsOpen(true)}
          >
            <Mic02Icon className="text-zinc-400" />
          </Button>
        </Tooltip>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-zinc-900 rounded-2xl text-white border-none">
        <DialogHeader>
          <DialogTitle className="text-center">Audio Transcription</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex justify-center items-center">
            <AnimatePresence>
              <div className="pingspinner pingspinner_large relative">
                <div className="h-full w-full absolute flex items-center justify-center z-[2]">
                  <Mic02Icon color="white" height={50} width={50} />
                </div>
              </div>
            </AnimatePresence>
          </div>
          {transcription && (
            <Textarea
              className="dark"
              label="Your message transcription"
              maxRows={7}
              value={transcription}
              variant="faded"
              onValueChange={setTranscription}
            />
          )}
          {error && <p className="text-red-500 text-center">{error}</p>}
          <div className="flex justify-center gap-5 mt-3">
            <Button color="danger" variant="flat" onClick={handleCancel}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button
              color="primary"
              disabled={!transcription}
              onPress={handleSend}
            >
              <Send className="mr-2 h-4 w-4" />
              Submit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
