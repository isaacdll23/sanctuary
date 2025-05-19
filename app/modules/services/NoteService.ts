// Renamed and refactored from PrincipleService.ts to NoteService.ts
import { db } from "~/db";
import { notesTable, foldersTable } from "~/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth, getUserFromSession } from "~/modules/auth.server";
import { generateNoteTitle } from "~/modules/ai.server";

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
    const folders = await getFolders(user.id);
    return {
      success: true,
      message: "Folder created.",
      folder: newFolder[0],
      folders,
    };
  }

  // Rename folder
  if (intent === "renameFolder") {
    const folderId = Number(formData.get("folderId"));
    const name = formData.get("name") as string;
    if (!folderId || !name) throw new Error("Folder ID and new name required.");
    const updated = await db
      .update(foldersTable)
      .set({ name: name.trim() })
      .where(
        and(eq(foldersTable.id, folderId), eq(foldersTable.userId, user.id))
      )
      .returning();
    const folders = await getFolders(user.id);
    if (updated.length === 0) {
      return {
        success: false,
        error: "Folder not found or permission denied.",
        folders,
      };
    }
    return {
      success: true,
      message: "Folder renamed.",
      folder: updated[0],
      folders,
    };
  }

  // Delete folder
  if (intent === "deleteFolder") {
    const folderId = Number(formData.get("folderId"));
    if (!folderId) throw new Error("Folder ID required.");
    // Remove folderId from notes in this folder
    await db
      .update(notesTable)
      .set({ folderId: null })
      .where(
        and(eq(notesTable.folderId, folderId), eq(notesTable.userId, user.id))
      );
    const deleted = await db
      .delete(foldersTable)
      .where(
        and(eq(foldersTable.id, folderId), eq(foldersTable.userId, user.id))
      )
      .returning();
    const folders = await getFolders(user.id);
    if (deleted.length === 0) {
      return {
        success: false,
        error: "Folder not found or permission denied.",
        folders,
      };
    }
    return {
      success: true,
      message: "Folder deleted.",
      folders,
    };
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
    return {
      success: true,
      message: "Note moved.",
      note: updated[0],
      notes: await getNotes(user.id),
      folders: await getFolders(user.id),
    };
  }

  // Generate note title
  if (intent === "generateNoteTitle") {
    const content = formData.get("content") as string;
    if (!content) {
      throw new Error("Content is required to generate a title.");
    }
    const title = await generateNoteTitle(content);
    return {
      success: true,
      message: "Title generated.",
      title,
    };
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
