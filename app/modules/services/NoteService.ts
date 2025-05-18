// Renamed and refactored from PrincipleService.ts to NoteService.ts
import { db } from "~/db";
import { notesTable, foldersTable } from "~/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth, getUserFromSession } from "~/modules/auth.server";

export async function handleNoteAction(request: Request) {
  const user = await getUserFromSession(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  // Create new note
  if (intent === "createNote") {
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const folderId = formData.get("folderId")
      ? Number(formData.get("folderId"))
      : null;

    if (!title || !content) {
      throw new Error("Title and Content are required for creating a note.");
    }

    const newNote = await db
      .insert(notesTable)
      .values({
        userId: user.id,
        title: title.trim(),
        content: content.trim(),
        folderId,
        updatedAt: new Date(),
      })
      .returning();

    return {
      success: true,
      message: "Note created.",
      note: newNote[0],
    };
  }

  // Update note
  if (intent === "updateNote") {
    const noteId = Number(formData.get("noteId"));
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const folderId = formData.get("folderId")
      ? Number(formData.get("folderId"))
      : null;

    if (!noteId || !title || !content) {
      throw new Error("Note ID, Title, and Content are required for updating.");
    }

    const updatedNotes = await db
      .update(notesTable)
      .set({
        title: title.trim(),
        content: content.trim(),
        folderId,
        updatedAt: new Date(),
      })
      .where(eq(notesTable.id, noteId))
      .returning();

    return {
      success: true,
      message: "Note updated.",
      note: updatedNotes[0] || null,
    };
  }

  // Delete note
  if (intent === "deleteNote") {
    const noteId = Number(formData.get("noteId"));
    if (!noteId) {
      throw new Error("Note ID is required for deletion.");
    }
    await db.delete(notesTable).where(eq(notesTable.id, noteId));
    return { success: true, message: "Note deleted." };
  }

  // Create folder
  if (intent === "createFolder") {
    const name = formData.get("name") as string;
    if (!name) throw new Error("Folder name is required.");
    const newFolder = await db
      .insert(foldersTable)
      .values({
        userId: user.id,
        name: name.trim(),
      })
      .returning();
    return { success: true, message: "Folder created.", folder: newFolder[0] };
  }

  // Rename folder
  if (intent === "renameFolder") {
    const folderId = Number(formData.get("folderId"));
    const name = formData.get("name") as string;
    if (!folderId || !name) throw new Error("Folder ID and new name required.");
    const updated = await db
      .update(foldersTable)
      .set({ name: name.trim() })
      .where(eq(foldersTable.id, folderId))
      .returning();
    return { success: true, message: "Folder renamed.", folder: updated[0] };
  }

  // Delete folder
  if (intent === "deleteFolder") {
    const folderId = Number(formData.get("folderId"));
    if (!folderId) throw new Error("Folder ID required.");
    // Remove folderId from notes in this folder
    await db
      .update(notesTable)
      .set({ folderId: null })
      .where(eq(notesTable.folderId, folderId));
    await db.delete(foldersTable).where(eq(foldersTable.id, folderId));
    return { success: true, message: "Folder deleted." };
  }

  // Move note to folder
  if (intent === "moveNoteToFolder") {
    const noteId = Number(formData.get("noteId"));
    const folderId = formData.get("folderId")
      ? Number(formData.get("folderId"))
      : null;
    if (!noteId) throw new Error("Note ID required.");
    const updated = await db
      .update(notesTable)
      .set({ folderId })
      .where(eq(notesTable.id, noteId))
      .returning();
    return { success: true, message: "Note moved.", note: updated[0] };
  }

  return {
    success: false,
    message: "Unknown action or missing required parameters.",
  };
}

export async function getNotes(userId: number) {
  return db
    .select()
    .from(notesTable)
    .where(eq(notesTable.userId, userId))
    .orderBy(notesTable.updatedAt);
}

export async function getNote(noteId: number, userId: number) {
  const results = await db
    .select()
    .from(notesTable)
    .where(and(eq(notesTable.id, noteId), eq(notesTable.userId, userId)));
  return results[0] || null;
}

export async function getFolders(userId: number) {
  return db
    .select()
    .from(foldersTable)
    .where(eq(foldersTable.userId, userId))
    .orderBy(foldersTable.name);
}
