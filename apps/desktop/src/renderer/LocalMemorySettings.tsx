import type {
  LocalMemoryResult,
  LocalMemorySnapshot,
  MessageLengthPreference,
} from "@ai-message-coach/contracts";
import { useCallback, useEffect, useState } from "react";

const labels: Record<MessageLengthPreference, string> = {
  CONCISE: "Concise",
  BALANCED: "Balanced",
  DETAILED: "Detailed",
};

export function isMessageLengthDirty(
  snapshot: LocalMemorySnapshot | undefined,
  selected: MessageLengthPreference,
): boolean {
  return snapshot !== undefined && selected !== snapshot.messageLength;
}

export function LocalMemorySettings() {
  const [snapshot, setSnapshot] = useState<LocalMemorySnapshot>();
  const [selected, setSelected] = useState<MessageLengthPreference>("BALANCED");
  const [status, setStatus] = useState("Checking protected local memory…");
  const [working, setWorking] = useState(false);
  const [canEraseUnavailable, setCanEraseUnavailable] = useState(false);

  const applyResult = useCallback((result: LocalMemoryResult) => {
    if (result.ok) {
      setSnapshot(result.snapshot);
      setCanEraseUnavailable(false);
      setSelected(result.snapshot.messageLength ?? "BALANCED");
      setStatus(result.snapshot.messageLength ? "Saved locally." : "No preference saved.");
      return;
    }
    if (result.error.code === "CONFLICT" || result.error.code === "UNKNOWN_WRITE_OUTCOME") {
      setSnapshot(undefined);
    }
    setCanEraseUnavailable(
      result.error.code === "KEY_UNAVAILABLE" || result.error.code === "STORE_UNAVAILABLE",
    );
    setStatus(result.error.message);
  }, []);

  const refresh = useCallback(async () => {
    const bridge = window.messageCoach;
    if (!bridge) {
      setSnapshot(undefined);
      setCanEraseUnavailable(true);
      setStatus("Protected local memory is unavailable.");
      return;
    }
    setWorking(true);
    try {
      const current = await bridge.getLocalMemoryStatus();
      if (current.available) {
        applyResult({ ok: true, snapshot: current.snapshot });
      } else {
        setSnapshot(undefined);
        setCanEraseUnavailable(
          current.error.code === "KEY_UNAVAILABLE" || current.error.code === "STORE_UNAVAILABLE",
        );
        setStatus(current.error.message);
      }
    } catch {
      setSnapshot(undefined);
      setCanEraseUnavailable(true);
      setStatus("Protected local memory is unavailable.");
    } finally {
      setWorking(false);
    }
  }, [applyResult]);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const save = async () => {
    if (!snapshot || !window.messageCoach) return;
    setWorking(true);
    try {
      applyResult(
        await window.messageCoach.saveMessageLength({
          generation: snapshot.generation,
          revision: snapshot.revision,
          value: selected,
        }),
      );
    } catch {
      setSnapshot(undefined);
      setStatus("Local memory is unavailable. Refresh before changing it again.");
    } finally {
      setWorking(false);
    }
  };

  const remove = async () => {
    if (!snapshot || !window.messageCoach) return;
    setWorking(true);
    try {
      applyResult(
        await window.messageCoach.deleteMessageLength({
          generation: snapshot.generation,
          revision: snapshot.revision,
        }),
      );
    } catch {
      setSnapshot(undefined);
      setStatus("Local memory is unavailable. Refresh before changing it again.");
    } finally {
      setWorking(false);
    }
  };

  const clear = async () => {
    if (
      !snapshot ||
      !window.messageCoach ||
      !window.confirm("Clear all protected local memory? Provider configuration is not deleted.")
    ) {
      return;
    }
    setWorking(true);
    try {
      applyResult(
        await window.messageCoach.clearLocalMemory({
          generation: snapshot.generation,
          confirmation: "CLEAR_LOCAL_MEMORY",
        }),
      );
    } catch {
      setSnapshot(undefined);
      setStatus("Local memory is unavailable. Refresh before changing it again.");
    } finally {
      setWorking(false);
    }
  };

  const resetUnavailable = async () => {
    if (
      !window.messageCoach ||
      !window.confirm(
        "Erase the unavailable encrypted local-memory files and create a new empty store? Existing local memory cannot be recovered. Provider configuration is not deleted.",
      )
    ) {
      return;
    }
    setWorking(true);
    try {
      applyResult(
        await window.messageCoach.resetUnavailableLocalMemory({
          confirmation: "ERASE_UNAVAILABLE_LOCAL_MEMORY",
        }),
      );
    } catch {
      setStatus("The unavailable local-memory files could not be erased.");
      setCanEraseUnavailable(true);
    } finally {
      setWorking(false);
    }
  };

  const dirty = isMessageLengthDirty(snapshot, selected);

  return (
    <details className="memory-settings">
      <summary>Local preferences</summary>
      <div className="memory-settings-body">
        <label htmlFor="message-length">Preferred message length</label>
        <select
          id="message-length"
          value={selected}
          disabled={!snapshot || working}
          onChange={(event) => setSelected(event.target.value as MessageLengthPreference)}
        >
          {Object.entries(labels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <div className="memory-actions">
          <button
            className="button button-primary"
            type="button"
            disabled={!dirty || working}
            onClick={save}
          >
            Save
          </button>
          <button
            className="button button-quiet"
            type="button"
            disabled={!snapshot?.messageLength || working}
            onClick={remove}
          >
            Delete preference
          </button>
          <button
            className="button button-danger"
            type="button"
            disabled={!snapshot || working}
            onClick={clear}
          >
            Clear all local memory
          </button>
          <button
            className="button button-quiet"
            type="button"
            disabled={working}
            onClick={refresh}
          >
            Refresh
          </button>
          {canEraseUnavailable ? (
            <button
              className="button button-danger"
              type="button"
              disabled={working}
              onClick={resetUnavailable}
            >
              Erase unavailable storage
            </button>
          ) : null}
        </div>
        <p className="memory-status" role="status">
          {working ? "Working…" : status}
        </p>
        <p className="memory-disclosure">
          Stored only in protected local storage. This preference is not applied to coaching yet.
        </p>
      </div>
    </details>
  );
}
