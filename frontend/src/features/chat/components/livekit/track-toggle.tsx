"use client";

import * as React from "react";
import { Track } from "livekit-client";
import { useTrackToggle } from "@livekit/components-react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@heroui/button";
import { cn } from "@/lib/utils";

export type TrackToggleProps = React.ComponentProps<typeof Button> & {
  source: Parameters<typeof useTrackToggle>[0]["source"];
  pending?: boolean;
  enabled?: boolean;
};

function getSourceIcon(
  source: Track.Source,
  enabled: boolean,
  pending = false,
) {
  if (pending) {
    return Loader2;
  }

  switch (source) {
    case Track.Source.Microphone:
      return enabled ? Mic : MicOff;
    default:
      return React.Fragment;
  }
}

export function TrackToggle({
  source,
  enabled,
  pending,
  className,
  onPress,
  ...props
}: TrackToggleProps) {
  const IconComponent = getSourceIcon(source, enabled ?? false, pending);

  return (
    <Button
      aria-label={`Toggle ${source}`}
      onPress={onPress}
      disabled={pending}
      className={cn(className)}
      {...props}
    >
      <IconComponent className={cn(pending && "animate-spin")} />
    </Button>
  );
}
