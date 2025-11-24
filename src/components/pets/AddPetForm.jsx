// FILE: src/components/pets/AddPetForm.jsx
import { useRef, useState } from "react";
import PropTypes from "prop-types";
import { User, Pet } from "@/api/entities";
import { UploadFile } from "@/api/integrations";

const BRAND_MAGENTA = "#e906d3";

export default function AddPetForm({ onCreated, onCancel }) {
  const formRef = useRef(null);

  const [name, setName] = useState("");
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

  const resetForm = () => {
    setName("");
    setBreed("");
    setSex("");
    setDob("");
    setPhotoFile(null);
    setPreview("");
    setMsg("");
  };

  const closeNearestDetails = () => {
    let el = formRef.current;
    while (el && el !== document.body) {
      if (el.tagName === "DETAILS") {
        el.open = false;
        break;
      }
      el = el.parentElement;
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setMsg("Name is required.");
      return;
    }
    setBusy(true);
    setMsg("");

    try {
      const user = await User.me();
      if (!user) throw new Error("Not authenticated");

      const pet = await Pet.create({
        name: name.trim(),
        breed: breed.trim() || null,
        sex: sex.trim() || null,
        dob: dob || null,
      });

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

        await Pet.update(pet.id, { photo_path: path });
      }

      resetForm();
      onCreated?.();
      closeNearestDetails();
    } catch (err) {
      setMsg(String(err.message || err));
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    closeNearestDetails();
    onCancel?.();
  };

  const btnPrimary = {
    borderRadius: 0,
    border: "1px solid #000",
    background: "#000",
    color: BRAND_MAGENTA,
    fontWeight: 700,
    padding: "8px 12px",
  };

  // Cancel now uses same brand treatment as Add
  const btnCancel = {
    ...btnPrimary,
  };

  return (
    <form
      ref={formRef}
      onSubmit={submit}
      className="grid"
      style={{ maxWidth: "100%" }}
    >
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
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

      <label style={{ marginTop: 4 }}>
        <div>Birthdate (optional)</div>
        <input
          type="date"
          value={dob}
          onChange={(e) => setDob(e.target.value)}
        />
      </label>

      <div style={{ margin: "6px 0" }}>
        <label
          htmlFor="pet-photo"
          style={{ display: "block", marginBottom: 6 }}
        >
          Photo (optional)
        </label>
        <input
          id="pet-photo"
          type="file"
          accept="image/*"
          onChange={onFile}
          style={{ width: "100%" }}
        />
        {preview ? (
          <img
            src={preview}
            alt="Preview"
            style={{
              marginTop: 8,
              height: 72,
              width: 72,
              objectFit: "cover",
              borderRadius: 12,
              border: "1px solid #ddd",
            }}
          />
        ) : null}
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
        <button type="submit" disabled={busy} style={btnPrimary}>
          {busy ? "Saving…" : "Add"}
        </button>
        <button type="button" onClick={handleCancel} style={btnCancel}>
          Cancel
        </button>
      </div>

      {msg && <div style={{ color: "crimson", marginTop: 8 }}>{msg}</div>}
    </form>
  );
}

AddPetForm.propTypes = {
  onCreated: PropTypes.func,
  onCancel: PropTypes.func,
};

function cryptoRandom() {
  const arr = new Uint32Array(4);
  (typeof crypto !== "undefined" && crypto.getRandomValues
    ? crypto.getRandomValues(arr)
    : arr.fill(Math.floor(Math.random() * 2 ** 32)));
  return Array.from(arr)
    .map((n) => n.toString(16).padStart(8, "0"))
    .join("");
}
