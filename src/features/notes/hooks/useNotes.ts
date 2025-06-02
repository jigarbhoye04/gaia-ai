import { useCallback, useState } from "react";

import { Note, NoteCreate, notesApi, NoteUpdate } from "../api/notesApi";

export const useNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await notesApi.fetchNotes();
      setNotes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch notes");
    } finally {
      setLoading(false);
    }
  }, []);

  const createNote = useCallback(async (note: NoteCreate): Promise<Note> => {
    try {
      setError(null);
      const newNote = await notesApi.createNote(note);
      setNotes((prev) => [newNote, ...prev]);
      return newNote;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create note");
      throw err;
    }
  }, []);

  const updateNote = useCallback(
    async (id: string, note: NoteUpdate): Promise<Note> => {
      try {
        setError(null);
        const updatedNote = await notesApi.updateNote(id, note);
        setNotes((prev) => prev.map((n) => (n.id === id ? updatedNote : n)));
        return updatedNote;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update note");
        throw err;
      }
    },
    [],
  );

  const deleteNote = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      await notesApi.deleteNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete note");
      throw err;
    }
  }, []);

  return {
    notes,
    loading,
    error,
    fetchNotes,
    createNote,
    updateNote,
    deleteNote,
  };
};
