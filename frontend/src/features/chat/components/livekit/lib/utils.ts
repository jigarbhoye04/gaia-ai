import { Room } from "livekit-client";
import type {
  ReceivedChatMessage,
  TextStreamData,
} from "@livekit/components-react";


export function transcriptionToChatMessage(
  textStream: TextStreamData,
  room: Room,
): ReceivedChatMessage {
  return {
    id: textStream.streamInfo.id,
    timestamp: textStream.streamInfo.timestamp,
    message: textStream.text,
    from:
      textStream.participantInfo.identity === room.localParticipant.identity
        ? room.localParticipant
        : Array.from(room.remoteParticipants.values()).find(
            (p) => p.identity === textStream.participantInfo.identity,
          ),
  };
}
