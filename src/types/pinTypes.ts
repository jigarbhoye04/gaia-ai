export interface PinCardProps {
  message: {
    message_id: string;
    response: string;
    searchWeb?: boolean;
    pageFetchURL?: string;
    date: string | Date;
    type: string;
  };
  conversation_id: string;
}
