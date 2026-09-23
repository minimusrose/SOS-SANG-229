import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client.js";

/**
 * Cities for the "Ville / zone" pickers, derived from the same
 * GET /hospitals/recognized response already used for the hospital picker
 * on "Signaler une urgence" — not a separate hardcoded list, so the two can
 * no longer drift out of sync with each other.
 */
export default function useCities() {
  const [cities, setCities] = useState([]);
  const [state, setState] = useState("loading"); // loading | ready | error

  const load = useCallback(async () => {
    setState("loading");
    try {
      const hospitals = await api.listRecognizedHospitals();
      const unique = Array.from(
        new Set(
          (Array.isArray(hospitals) ? hospitals : [])
            .map((hospital) => hospital.city)
            .filter(Boolean),
        ),
      ).sort((a, b) => a.localeCompare(b, "fr"));
      setCities(unique);
      setState("ready");
    } catch {
      setCities([]);
      setState("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { cities, state, reload: load };
}
