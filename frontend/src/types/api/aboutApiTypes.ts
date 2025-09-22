/**
 * Types for the About page API
 */

export interface Author {
  name: string;
  avatar: string;
  role: string;
  linkedin?: string;
  twitter?: string;
}

export interface AboutData {
  content: string;
  authors: Author[];
}
