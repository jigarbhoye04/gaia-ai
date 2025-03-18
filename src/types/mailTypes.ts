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
