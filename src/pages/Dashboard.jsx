// FILE: src/pages/Dashboard.jsx
import PropTypes from "prop-types";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import AddPetForm from "../components/pets/AddPetForm";
import PetCarousel from "../components/PetCarousel";
import { getPublicUrl, UploadFile } from "@/api/integrations";

/* Inline down-chevron SVG (matches Dose History; 18px) */
const CHEV_BG =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M4 8 L12 16 L20 8' stroke='black' stroke-width='3' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>\")";

/** Header row for the <summary>, independent of global styles */
function SummaryHeader({ open, label = "Add Pet" }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        cursor: "pointer",
        userSelect: "none",
        paddingRight: 4,
      }}
    >
      <span style={{ fontWeight: 400 }}>{label}</span>
      <span
        aria-hidden
        style={{
          width: 18,
          height: 18,
          backgroundImage: CHEV_BG,
          backgroundRepeat: "no-repeat",
          backgroundSize: "18px 18px",
          transform: open ? "rotate(180deg)" : "none",
          transition: "transform 160ms ease",
          flex: "0 0 18px",
        }}
      />
    </div>
  );
}
SummaryHeader.propTypes = {
  open: PropTypes.bool,
  label: PropTypes.string,
};

export default function Dashboard() {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);

  const addPetDetailsRef = useRef(null);
  const [addOpen, setAddOpen] = useState(false);

  // inline edit state
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editBreed, setEditBreed] = useState("");
  const [editSex, setEditSex] = useState("");
  const [editDob, setEditDob] = useState("");
  const [editBusy, setEditBusy] = useState(false);
  const [editError, setEditError] = useState("");

  // photo editing state
  const [editPhotoFile, setEditPhotoFile] = useState(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState("");

  const loadPets = useCallback(async () => {
    setLoading(true);
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) {
      setPets([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("pets")
      .select("id, name, breed, sex, dob, photo_path")
      .or(`user_id.eq.${user.id},owner_id.eq.${user.id}`)
      .order("name", { ascending: true });

    if (!error) {
      const withUrls = (data || []).map((p) => ({
        ...p,
        photo_url: p.photo_path ? getPublicUrl("pet-photos", p.photo_path) : "",
      }));
      setPets(withUrls);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPets();
  }, [loadPets]);

  const handlePetCreated = () => loadPets();
  const handleCancelAddPet = () => {
    if (addPetDetailsRef.current) addPetDetailsRef.current.open = false;
    setAddOpen(false);
  };

  const deletePet = async (id) => {
    await supabase.from("pets").delete().eq("id", id);
    if (editingId === id) {
      resetEditState();
    }
    loadPets();
  };

  const resetEditState = () => {
    setEditingId(null);
    setEditName("");
    setEditBreed("");
    setEditSex("");
    setEditDob("");
    setEditError("");
    setEditPhotoFile(null);
    setEditPhotoPreview("");
  };

  const startEdit = (pet) => {
    setEditingId(pet.id);
    setEditName(pet.name || "");
    setEditBreed(pet.breed || "");
    setEditSex(pet.sex || "");
    setEditDob(pet.dob || "");
    setEditError("");
    setEditPhotoFile(null);
    setEditPhotoPreview("");
  };

  const cancelEdit = () => {
    resetEditState();
  };

  const onEditPhotoChange = (e) => {
    const f = e.target.files?.[0] || null;
    setEditPhotoFile(f);
    setEditPhotoPreview(f ? URL.createObjectURL(f) : "");
  };

  const saveEdit = async () => {
    if (!editName.trim()) {
      setEditError("Name is required.");
      return;
    }
    setEditBusy(true);
    setEditError("");

    try {
      // 1) Update basic fields
      const { error } = await supabase
        .from("pets")
        .update({
          name: editName.trim(),
          breed: editBreed.trim() || null,
          sex: editSex.trim() || null,
          dob: editDob || null,
        })
        .eq("id", editingId);

      if (error) throw error;

      // 2) Optional photo update
      if (editPhotoFile) {
        const { data: auth } = await supabase.auth.getUser();
        const user = auth?.user;
        if (!user) throw new Error("Not authenticated");

        const ext = (editPhotoFile.name?.split(".").pop() || "jpg").toLowerCase();
        const filename = `${cryptoRandom()}-${Date.now()}.${ext}`;
        const path = `${user.id}/${editingId}/${filename}`;

        await UploadFile({
          bucket: "pet-photos",
          path,
          file: editPhotoFile,
          contentType: editPhotoFile.type || "image/jpeg",
          upsert: false,
        });

        const { error: photoErr } = await supabase
          .from("pets")
          .update({ photo_path: path })
          .eq("id", editingId);
        if (photoErr) throw photoErr;
      }

      await loadPets();
      resetEditState();
    } catch (err) {
      setEditError(String(err.message || err));
    } finally {
      setEditBusy(false);
    }
  };

  // Brand-styled small buttons for card footer
  const footerButton = {
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 700,
    borderRadius: 0,
    lineHeight: 1.2,
    minHeight: 0,
    minWidth: 0,
    boxSizing: "border-box",
    background: "#000",
    color: "#ea00c8",
    border: "1px solid #000",
  };

  return (
    <div>
      {/* Add Pet */}
      <div className="card" style={{ overflow: "hidden" }}>
        <details
          ref={addPetDetailsRef}
          onToggle={(e) => setAddOpen(e.currentTarget.open)}
        >
          <summary style={{ listStyle: "none" }}>
            <SummaryHeader open={addOpen} label="Add Pet" />
          </summary>

          <div style={{ marginTop: 8 }}>
            <AddPetForm
              onCreated={handlePetCreated}
              onCancel={handleCancelAddPet}
            />
          </div>
        </details>
      </div>

      {/* My Pets */}
      <div
        className="card"
        style={{ paddingTop: 8, overflow: "hidden" }}
      >
        <h2 style={{ marginBottom: 8, fontWeight: 500 }}>My Pets</h2>

        {loading && <p>Loading pets…</p>}
        {!loading && pets.length === 0 && <p>No pets yet.</p>}

        {!loading && pets.length > 0 && (
          <PetCarousel
            items={pets}
            renderItem={(pet) => {
              const isEditing = editingId === pet.id;
              const currentPhotoUrl = isEditing
                ? editPhotoPreview || pet.photo_url
                : pet.photo_url;

              return (
                <div
                  className="card"
                  style={{ overflow: "hidden" }}
                >
                  {/* Top row: photo + name side-by-side */}
                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{
                        height: 72,
                        width: 72,
                        borderRadius: 12,
                        overflow: "hidden",
                        border: "1px solid #e5e5e5",
                        background: "#f6f6f6",
                        flexShrink: 0,
                      }}
                    >
                      {currentPhotoUrl ? (
                        <img
                          src={currentPhotoUrl}
                          alt={editName || pet.name}
                          style={{
                            height: "100%",
                            width: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            height: "100%",
                            width: "100%",
                            display: "grid",
                            placeItems: "center",
                            fontSize: 12,
                            color: "#777",
                          }}
                        >
                          No photo
                        </div>
                      )}
                    </div>

                    <div style={{ fontWeight: 500 }}>
                      {isEditing ? editName : pet.name}
                    </div>
                  </div>

                  {/* Body: details or edit form (full width, inside padding) */}
                  {!isEditing ? (
                    <>
                      <div className="small" style={{ marginTop: 2 }}>
                        Breed: {pet.breed || "—"} &nbsp;|&nbsp; Sex:{" "}
                        {pet.sex || "—"}
                      </div>

                      <div className="small" style={{ marginTop: 4 }}>
                        Birthdate:{" "}
                        {pet.dob ? formatDateYmdToUs(pet.dob) : "—"}
                      </div>
                    </>
                  ) : (
                    <div
                      style={{
                        marginTop: 4,
                        display: "grid",
                        gap: 6,
                        maxWidth: "100%",
                      }}
                    >
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Name"
                      />
                      <input
                        type="text"
                        value={editBreed}
                        onChange={(e) => setEditBreed(e.target.value)}
                        placeholder="Breed"
                      />
                      <input
                        type="text"
                        value={editSex}
                        onChange={(e) => setEditSex(e.target.value)}
                        placeholder="Sex"
                      />
                      <label className="small">
                        <div>Birthdate</div>
                        <input
                          type="date"
                          value={editDob || ""}
                          onChange={(e) => setEditDob(e.target.value)}
                        />
                      </label>

                      {/* Photo upload while editing */}
                      <label className="small">
                        <div>Photo</div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={onEditPhotoChange}
                          style={{ width: "100%" }}
                        />
                      </label>

                      {editError && (
                        <div
                          className="small"
                          style={{ color: "crimson", marginTop: 4 }}
                        >
                          {editError}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Footer buttons, left aligned, inside card */}
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      marginTop: 10,
                    }}
                  >
                    {!isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => startEdit(pet)}
                          style={footerButton}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deletePet(pet.id)}
                          style={footerButton}
                        >
                          Delete
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={saveEdit}
                          disabled={editBusy}
                          style={footerButton}
                        >
                          {editBusy ? "Saving…" : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          disabled={editBusy}
                          style={footerButton}
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            }}
          />
        )}
      </div>
    </div>
  );
}

function formatDateYmdToUs(ymd) {
  if (typeof ymd !== "string") return String(ymd ?? "");
  const m = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return ymd;
  const [, yyyy, mm, dd] = m;
  return `${mm}/${dd}/${yyyy}`;
}

function cryptoRandom() {
  const arr = new Uint32Array(4);
  (typeof crypto !== "undefined" && crypto.getRandomValues
    ? crypto.getRandomValues(arr)
    : arr.fill(Math.floor(Math.random() * 2 ** 32)));
  return Array.from(arr)
    .map((n) => n.toString(16).padStart(8, "0"))
    .join("");
}
