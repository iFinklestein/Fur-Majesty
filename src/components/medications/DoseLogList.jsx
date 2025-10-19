// FILE: src/components/medications/DoseLogList.jsx
import PropTypes from "prop-types";
import { useCallback, useEffect, useState } from "react";
import { listPets } from "@/api/entities";
import { DoseLog } from "@/api/medications";

export default function DoseLogList({ allowAll = false }) {
  const [pets, setPets] = useState([]);
  const [petId, setPetId] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load pets for selector
  useEffect(() => {
    (async () => {
      const list = await listPets();
      setPets(list || []);
      if (list?.length && !petId) setPetId(list[0].id);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await DoseLog.list({ petId: allowAll ? null : petId });
      setRows(data || []);
    } catch (e) {
      console.error(e);
      alert("Failed to load dose logs");
    } finally {
      setLoading(false);
    }
  }, [petId, allowAll]);

  // Initial/dep-load
  useEffect(() => {
    if (!allowAll && !petId) return;
    reload();
  }, [reload, petId, allowAll]);

  // Refresh when a dose is logged (from DoseLogForm)
  useEffect(() => {
    function onLogged(e) {
      const targetPetId = e?.detail?.petId;
      if (allowAll || targetPetId === petId) {
        reload();
      }
    }
    window.addEventListener("dose-logged", onLogged);
    return () => window.removeEventListener("dose-logged", onLogged);
  }, [reload, petId, allowAll]);

  async function onDelete(row) {
    if (!row?.id) return;
    if (!confirm("Delete this dose entry?")) return;
    try {
      await DoseLog.remove(row.id);
      await reload();
    } catch (e) {
      console.error(e);
      alert("Failed to delete");
    }
  }

  return (
    <div className="rounded border p-4 mt-3">
      {!allowAll && (
        <div className="mb-3 flex items-center gap-3">
          <span className="text-sm text-gray-600">Dose Logs</span>
          <select
            value={petId}
            onChange={(e) => setPetId(e.target.value)}
            className="rounded border px-2 py-1"
          >
            {pets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <div>Loading…</div>
      ) : rows.length === 0 ? (
        <div>No dose logs yet.</div>
      ) : (
        <ul className="divide-y">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between py-3">
              <div>
                <div className="font-medium">
                  {new Date(r.given_at).toLocaleString()}
                </div>
                <div className="text-xs text-gray-600">
                  {r.amount ? `Amount: ${r.amount}` : ""}
                  {r.notes ? ` — ${r.notes}` : ""}
                </div>
              </div>
              <button
                type="button"
                className="rounded border px-2 py-1 text-sm text-red-600"
                onClick={() => onDelete(r)}
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

DoseLogList.propTypes = {
  /** When true, shows logs across all pets and hides the pet selector. */
  allowAll: PropTypes.bool,
};
