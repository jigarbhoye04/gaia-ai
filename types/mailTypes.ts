import { Tag } from "emblor";

export interface EmailData {
  id: string;
  from: string;
  subject: string;
  time: string;
  snippet?: string;
  body?: string;
  labelIds?: string[];
  headers: any;
  payload: EmailPayload;
}

export interface EmailsResponse {
  emails: EmailData[];
  nextPageToken?: string;
}

export interface EmailPayload {
  [x: string]: any;
  parts: any;
  body: any;
  payload: {
    headers: { name: string; value: string }[];
    parts?: { mimeType: string; body: { data: string } }[];
    body?: { data: string };
  };
}

// Mail component props
export interface MailComposeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface EmailRecipientsProps {
  toEmails: Tag[];
  setToEmails: React.Dispatch<React.SetStateAction<Tag[]>>;
  ccEmails: Tag[];
  setCcEmails: React.Dispatch<React.SetStateAction<Tag[]>>;
  bccEmails: Tag[];
  setBccEmails: React.Dispatch<React.SetStateAction<Tag[]>>;
  showCcBcc: boolean;
  setShowCcBcc: React.Dispatch<React.SetStateAction<boolean>>;
  activeTagIndex: number | null;
  setActiveTagIndex: React.Dispatch<React.SetStateAction<number | null>>;
  onOpenAiModal: () => void;
}

export interface EmailListProps {
  emails: EmailData[];
  isLoading: boolean;
  hasNextPage: boolean;
  loadMoreItems: (startIndex: number, stopIndex: number) => Promise<void>;
  onEmailSelect: (email: EmailData) => void;
}

export interface EmailsPageProps {
  category: "inbox" | "important";
  title: string;
}
