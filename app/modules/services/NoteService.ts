// Renamed and refactored from PrincipleService.ts to NoteService.ts
import { db } from "~/db";
import { notesTable, foldersTable } from "~/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth, getUserFromSession } from "~/modules/auth.server";
import { generateNoteTitle } from "~/modules/ai.server";
import { encryptNoteContent, decryptNoteContent } from "~/modules/services/NoteEncryptionService";

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

    const encryptedContent = encryptNoteContent(content.trim());

    const newNote = await db
      .insert(notesTable)
      .values({
        userId: user.id,
        title: title.trim(),
        content: encryptedContent,
        isEncrypted: 1,
        encryptionMetadata: {
          version: 1,
          algorithm: "aes-256-gcm",
          encryptedAt: new Date().toISOString(),
        },
        folderId,
        updatedAt: new Date(),
      })
      .returning();

    // Return decrypted note to client
    const decryptedNote = {
      ...newNote[0],
      content: content.trim(),
    };

    return {
      success: true,
      message: "Note created.",
      note: decryptedNote,
    };
  }

  // Update note (manual save)
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

    const encryptedContent = encryptNoteContent(content.trim());

    const updatedNotes = await db
      .update(notesTable)
      .set({
        title: title.trim(),
        content: encryptedContent,
        isEncrypted: 1,
        encryptionMetadata: {
          version: 1,
          algorithm: "aes-256-gcm",
          encryptedAt: new Date().toISOString(),
        },
        folderId,
        updatedAt: new Date(),
      })
      .where(eq(notesTable.id, noteId))
      .returning();

    // Return decrypted note to client
    const decryptedNote = updatedNotes[0]
      ? {
          ...updatedNotes[0],
          content: content.trim(),
        }
      : null;

    return {
      success: true,
      message: "Note updated.",
      note: decryptedNote,
    };
  }

  // Auto-save note (does not close editor)
  if (intent === "autoSaveNote") {
    const noteId = Number(formData.get("noteId"));
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const folderId = formData.get("folderId")
      ? Number(formData.get("folderId"))
      : null;

    if (!noteId || !title || !content) {
      return {
        success: false,
        error: "Note ID, Title, and Content are required for auto-save.",
      };
    }

    try {
      const encryptedContent = encryptNoteContent(content.trim());

      const updatedNotes = await db
        .update(notesTable)
        .set({
          title: title.trim(),
          content: encryptedContent,
          isEncrypted: 1,
          encryptionMetadata: {
            version: 1,
            algorithm: "aes-256-gcm",
            encryptedAt: new Date().toISOString(),
          },
          folderId,
          updatedAt: new Date(),
        })
        .where(eq(notesTable.id, noteId))
        .returning();

      if (updatedNotes.length === 0) {
        return {
          success: false,
          error: "Note not found or permission denied.",
        };
      }

      return {
        success: true,
        message: "Note auto-saved.",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: `Auto-save failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
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

/**
 * Helper function to decrypt a note's content
 * Handles both encrypted and unencrypted notes for backward compatibility
 * Returns decrypted content or throws error if decryption fails
 */
function decryptNoteIfNeeded(
  note: typeof notesTable.$inferSelect
): typeof notesTable.$inferSelect {
  if (!note.isEncrypted) {
    return note;
  }

  try {
    const decryptedContent = decryptNoteContent(note.content);
    return {
      ...note,
      content: decryptedContent,
    };
  } catch (error) {
    throw new Error(
      `Failed to decrypt note ${note.id}: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Helper function to decrypt multiple notes
 * Skips and logs notes that fail to decrypt
 */
function decryptNotesIfNeeded(
  notes: Array<typeof notesTable.$inferSelect>
): Array<typeof notesTable.$inferSelect> {
  return notes.map((note) => {
    try {
      return decryptNoteIfNeeded(note);
    } catch (error) {
      console.error(
        `Error decrypting note ${note.id}:`,
        error instanceof Error ? error.message : "Unknown error"
      );
      // Return note with placeholder content to prevent complete failure
      return {
        ...note,
        content: "[ERROR: Unable to decrypt this note]",
      };
    }
  });
}

export async function getNotes(userId: number) {
  const { desc } = await import("drizzle-orm");
  const notes = await db
    .select()
    .from(notesTable)
    .where(eq(notesTable.userId, userId))
    .orderBy(desc(notesTable.updatedAt));

  return decryptNotesIfNeeded(notes);
}

export async function getNote(noteId: number, userId: number) {
  const results = await db
    .select()
    .from(notesTable)
    .where(and(eq(notesTable.id, noteId), eq(notesTable.userId, userId)));

  if (results.length === 0) return null;

  try {
    return decryptNoteIfNeeded(results[0]);
  } catch (error) {
    console.error(
      `Error decrypting note ${noteId}:`,
      error instanceof Error ? error.message : "Unknown error"
    );
    // Return note with error placeholder
    return {
      ...results[0],
      content: "[ERROR: Unable to decrypt this note]",
    };
  }
}

export async function getFolders(userId: number) {
  return db
    .select()
    .from(foldersTable)
    .where(eq(foldersTable.userId, userId))
    .orderBy(foldersTable.name);
}

/**
 * Bulk encrypt all unencrypted notes across the system
 * Admin-only operation to retroactively encrypt legacy notes
 * Returns { success, message, encrypted, failed, total }
 */
export async function bulkEncryptAllNotes() {
  try {
    // Fetch all unencrypted notes
    const unencryptedNotes = await db
      .select()
      .from(notesTable)
      .where(eq(notesTable.isEncrypted, 0));

    if (unencryptedNotes.length === 0) {
      return {
        success: true,
        message: "No unencrypted notes found.",
        encrypted: 0,
        failed: 0,
        total: 0,
      };
    }

    let encrypted = 0;
    let failed = 0;
    const failedNotes: Array<{ id: number; error: string }> = [];

    // Encrypt each note
    for (const note of unencryptedNotes) {
      try {
        const encryptedContent = encryptNoteContent(note.content);
        
        await db
          .update(notesTable)
          .set({
            content: encryptedContent,
            isEncrypted: 1,
            encryptionMetadata: {
              version: 1,
              algorithm: "aes-256-gcm",
              encryptedAt: new Date().toISOString(),
            },
          })
          .where(eq(notesTable.id, note.id));

        encrypted++;
      } catch (error) {
        failed++;
        failedNotes.push({
          id: note.id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return {
      success: failed === 0,
      message:
        failed === 0
          ? `Successfully encrypted ${encrypted} notes.`
          : `Encrypted ${encrypted} notes with ${failed} failures.`,
      encrypted,
      failed,
      total: unencryptedNotes.length,
      failedNotes: failed > 0 ? failedNotes : undefined,
    };
  } catch (error) {
    return {
      success: false,
      message: `Bulk encryption failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      encrypted: 0,
      failed: 0,
      total: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
