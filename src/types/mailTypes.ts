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
}

export interface EmailsResponse {
  emails: EmailData[];
  nextPageToken?: string;
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
