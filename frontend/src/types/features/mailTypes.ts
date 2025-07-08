export interface EmailData {
  id: string;
  from: string;
  subject: string;
  time: string;
  snippet?: string;
  body?: string;
  labelIds?: string[];
  headers: Record<string, string>;
  payload: EmailPayload;
  summary?: string;
  threadId?: string; // Thread ID for grouping related messages
}

export interface EmailsResponse {
  emails: EmailData[];
  nextPageToken?: string;
}

export interface EmailThreadResponse {
  thread_id: string;
  messages_count: number;
  thread: {
    messages: EmailData[];
  };
}

export interface EmailPayload {
  [x: string]: unknown;
  parts: EmailPart[];
  body: EmailBody;
  payload: {
    headers: { name: string; value: string }[];
    parts?: { mimeType: string; body: { data: string } }[];
    body?: { data: string };
  };
}

export interface EmailPart {
  mimeType: string;
  filename?: string;
  headers?: { name: string; value: string }[];
  body?: EmailBody;
  parts?: EmailPart[];
}

export interface EmailBody {
  size: number;
  data?: string;
  attachmentId?: string;
}

// Email compose data structure for email intent
export type EmailComposeData = {
  to: string[];
  subject: string;
  body: string;
};
