import { apiService } from "@/lib/api";

export interface Note {
  id: string;
  content: string;
  auto_created?: boolean;
  plaintext: string;
  title?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface NoteCreate {
  content: string;
  title?: string;
  description?: string;
}

export interface NoteUpdate {
  content?: string;
  title?: string;
  description?: string;
}

export const notesApi = {
  // Fetch all notes
  fetchNotes: async (): Promise<Note[]> => {
    const data = await apiService.get<Note[]>("/notes", {
      errorMessage: "Failed to fetch notes",
    });
    return data || [];
  },

  // Fetch single note by ID
  fetchNoteById: async (id: string): Promise<Note> => {
    return apiService.get<Note>(`/notes/${id}`, {
      errorMessage: "Failed to fetch note",
    });
  },

  // Create a new note
  createNote: async (note: NoteCreate): Promise<Note> => {
    return apiService.post<Note>("/notes", note, {
      successMessage: "Note created successfully!",
      errorMessage: "Failed to create note",
    });
  },

  // Update a note
  updateNote: async (id: string, note: NoteUpdate): Promise<Note> => {
    return apiService.put<Note>(`/notes/${id}`, note, {
      successMessage: "Note updated successfully!",
      errorMessage: "Failed to update note",
    });
  },

  // Delete a note
  deleteNote: async (id: string): Promise<void> => {
    return apiService.delete(`/notes/${id}`, {
      successMessage: "Note deleted successfully!",
      errorMessage: "Failed to delete note",
    });
  },
};
