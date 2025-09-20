import React, { useState } from "react";
import { PetNote } from "@/api/entities";
import { format } from "date-fns";
import {
  Notebook,
  Plus,
  Edit,
  Trash2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function PetNotes({ petId, notes, onUpdate }) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [noteText, setNoteText] = useState("");

  const handleAddNew = () => {
    setEditingNote(null);
    setNoteText("");
    setShowDialog(true);
  };

  const handleEdit = (note) => {
    setEditingNote(note);
    setNoteText(note.text);
    setShowDialog(true);
  };

  const handleDelete = async (noteId) => {
    if (window.confirm("Are you sure you want to delete this note?")) {
      try {
        await PetNote.delete(noteId);
        onUpdate();
      } catch (error) {
        console.error("Error deleting note:", error);
        alert("Failed to delete note.");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    try {
      if (editingNote) {
        await PetNote.update(editingNote.id, { text: noteText });
      } else {
        await PetNote.create({ petId, text: noteText });
      }
      onUpdate();
      setShowDialog(false);
    } catch (error) {
      console.error("Error saving note:", error);
      alert("Failed to save note.");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Notebook className="w-5 h-5 text-gray-500" />
          Notes
        </CardTitle>
        <Button size="sm" onClick={handleAddNew}>
          <Plus className="w-4 h-4 mr-2" />
          Add Note
        </Button>
      </CardHeader>
      <CardContent>
        {notes.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No notes yet. Add your first one.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <div key={note.id} className="p-3 border rounded-lg group">
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{note.text}</p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    {format(new Date(note.updated_date), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(note)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(note.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingNote ? "Edit Note" : "Add New Note"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="note-text" className="sr-only">Note</Label>
              <Textarea
                id="note-text"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Write your note here..."
                rows={8}
                required
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit">Save Note</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}