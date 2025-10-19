import { useState } from "react";
import PropTypes from "prop-types";
import { User, Pet } from "@/api/entities";
import { UploadFile } from "@/api/integrations";

export default function AddPetForm({ onCreated }) {
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [breed, setBreed] = useState("");
  const [sex, setSex] = useState("");
  const [dob, setDob] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const onFile = (e) => {
    const f = e.target.files?.[0] || null;
    setPhotoFile(f);
    setPreview(f ? URL.createObjectURL(f) : "");
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !species.trim()) {
      setMsg("Name and species are required.");
      return;
    }
    setBusy(true);
    setMsg("");

    try {
      const user = await User.me();
      if (!user) throw new Error("Not authenticated");

      // 1) Create pet (entities.create writes both user_id & owner_id)
      const pet = await Pet.create({
        name: name.trim(),
        species: species.trim(),
        breed: breed.trim() || null,
        sex: sex.trim() || null,
        dob: dob || null,
      });

      // 2) Optional photo upload
      if (photoFile) {
        const ext = (photoFile.name?.split(".").pop() || "jpg").toLowerCase();
        const filename = `${cryptoRandom()}-${Date.now()}.${ext}`;
        const path = `${user.id}/${pet.id}/${filename}`;

        await UploadFile({
          bucket: "pet-photos",
          path,
          file: photoFile,
          contentType: photoFile.type || "image/jpeg",
          upsert: false,
        });

        // Persist path on the pet
        await Pet.update(pet.id, { photo_path: path });
      }

      // Reset form
      setName(""); setSpecies(""); setBreed(""); setSex(""); setDob("");
      setPhotoFile(null); setPreview("");

      onCreated?.();
    } catch (err) {
      setMsg(String(err.message || err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid" data-medication-form>
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Species"
        value={species}
        onChange={(e) => setSpecies(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Breed"
        value={breed}
        onChange={(e) => setBreed(e.target.value)}
      />
      <input
        type="text"
        placeholder="Sex"
        value={sex}
        onChange={(e) => setSex(e.target.value)}
      />
      <input
        type="date"
        placeholder="Birthdate"
        value={dob}
        onChange={(e) => setDob(e.target.value)}
      />

      <div style={{ margin: "6px 0" }}>
        <label htmlFor="pet-photo" style={{ display: "block", marginBottom: 6 }}>Photo (optional)</label>
        <input id="pet-photo" type="file" accept="image/*" onChange={onFile} />
        {preview ? (
          <img
            src={preview}
            alt="Preview"
            style={{ marginTop: 8, height: 72, width: 72, objectFit: "cover", borderRadius: 12, border: "1px solid #ddd" }}
          />
        ) : null}
      </div>

      <div>
        <button type="submit" disabled={busy} className="btn">
          {busy ? "Saving…" : "Add"}
        </button>
      </div>
      {msg && <div style={{ color: "crimson" }}>{msg}</div>}
    </form>
  );
}

AddPetForm.propTypes = {
  onCreated: PropTypes.func,
};

// Simple filename nonce
function cryptoRandom() {
  const arr = new Uint32Array(4);
  (typeof crypto !== "undefined" && crypto.getRandomValues)
    ? crypto.getRandomValues(arr)
    : arr.fill(Math.floor(Math.random() * 2 ** 32));
  return Array.from(arr).map(n => n.toString(16).padStart(8, "0")).join("");
}
