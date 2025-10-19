// src/components/pets/PetNotes.jsx
import PropTypes from "prop-types";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function PetNotes({ petId }) {
  const [notes, setNotes] = useState([]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const loadNotes = useCallback(async () => {
    if (!petId) return;
    const { data, error } = await supabase
      .from("pet_notes")
      .select("*")
      .eq("pet_id", petId)
      .order("created_at", { ascending: true });

    if (!error && data) setNotes(data);
  }, [petId]);

  useEffect(() => {
    // Load whenever petId changes
    loadNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petId]);

  const addNote = async (e) => {
    e.preventDefault();
    if (!note.trim()) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("pet_notes")
      .insert([{ pet_id: petId, body: note.trim() }])
      .select()
      .single();
    setLoading(false);
    if (error) return;
    setNote("");
    setNotes((prev) => [...prev, data]);
  };

  const deleteNote = async (id) => {
    await supabase.from("pet_notes").delete().eq("id", id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontWeight: 400, marginBottom: 8 }}>Notes</div>

      <form onSubmit={addNote}>
        <input
          placeholder="Write a note..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          style={{ marginRight: 8, minWidth: 240 }}
          required
        />
        <button type="submit" disabled={loading} className="btn">
          {loading ? "Adding…" : "Add Note"}
        </button>
      </form>

      {notes.length === 0 ? (
        <p style={{ marginTop: 8, color: "#666" }}>No notes yet.</p>
      ) : (
        <ul style={{ marginTop: 8 }}>
          {notes.map((n) => (
            <li key={n.id} style={{ marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: "#666" }}>
                {n.created_at ? `${new Date(n.created_at).toLocaleString()}: ` : ""}
              </span>
              <span>{n.body ?? ""}</span>
              <button
                onClick={() => deleteNote(n.id)}
                style={{ marginLeft: 10 }}
                title="Delete note"
                className="btn"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

PetNotes.propTypes = {
  petId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};
