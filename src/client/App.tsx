import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import type { Encounter } from "../shared/types";
import { slugify } from "../shared/slug";
import { newEncounter, reducer } from "./state/encounterReducer";
import { ConflictError, api, lastSlug } from "./state/useEncounterApi";
import type { EncounterSummary } from "./state/useEncounterApi";
import { EncounterTitle } from "./components/EncounterTitle";
import { Toolbar } from "./components/Toolbar";
import { CombatTable } from "./components/CombatTable";
import { OpenMenu } from "./components/OpenMenu";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { LibraryProvider } from "./state/customLibrary";

const snap = (e: Encounter) => JSON.stringify({ ...e, updatedAt: "" });

interface Pending {
  message: string;
  confirmLabel: string;
  run: () => void;
}

export default function App() {
  const [encounter, dispatch] = useReducer(reducer, undefined, newEncounter);
  const [savedSnap, setSavedSnap] = useState(() => snap(encounter));
  const [pending, setPending] = useState<Pending | null>(null);
  const [list, setList] = useState<EncounterSummary[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [status, setStatus] = useState<{ text: string; error?: boolean }>({ text: "" });
  const [saving, setSaving] = useState(false);
  const [last, setLast] = useState<string | null>(() => lastSlug.get());

  const dirty = snap(encounter) !== savedSnap;

  const guard = useCallback(
    (message: string, confirmLabel: string, run: () => void) => {
      if (dirty) setPending({ message: `${message} You have unsaved changes that will be lost.`, confirmLabel, run });
      else run();
    },
    [dirty],
  );

  const doSave = useCallback(
    async (overwrite = false) => {
      const slug = slugify(encounter.name);
      setSaving(true);
      try {
        const updatedAt = await api.save(slug, encounter, overwrite);
        setSavedSnap(snap(encounter));
        lastSlug.set(slug);
        setLast(slug);
        setStatus({ text: `Saved ${slug}.json at ${new Date(updatedAt).toLocaleTimeString()}` });
      } catch (e) {
        if (e instanceof ConflictError) {
          setPending({
            message: `Overwrite '${encounter.name}'? Another encounter already uses this name.`,
            confirmLabel: "Overwrite",
            run: () => void doSave(true),
          });
        } else {
          setStatus({ text: "Could not save. Is the server running?", error: true });
        }
      } finally {
        setSaving(false);
      }
    },
    [encounter],
  );

  const saveRef = useRef(doSave);
  saveRef.current = doSave;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void saveRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const onUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [dirty]);

  const refreshList = useCallback(async () => {
    try {
      setList(await api.list());
      setListError(null);
    } catch {
      setListError("Could not load saved encounters.");
    }
  }, []);

  const load = (enc: Encounter) => {
    dispatch({ type: "load", encounter: enc });
    setSavedSnap(snap(enc));
  };

  const open = (slug: string) =>
    guard("Open another encounter?", "Open", async () => {
      try {
        const enc = await api.load(slug);
        load(enc);
        lastSlug.set(slug);
        setLast(slug);
        setStatus({ text: `Opened ${enc.name}` });
      } catch {
        setStatus({ text: "Could not open that encounter.", error: true });
      }
    });

  const remove = (item: EncounterSummary) =>
    setPending({
      message: `Delete '${item.name}'? It disappears from the list; the file stays on disk marked as deleted.`,
      confirmLabel: "Delete",
      run: async () => {
        try {
          await api.remove(item.slug);
          setStatus({ text: `Deleted ${item.name}` });
          void refreshList();
        } catch {
          setStatus({ text: "Could not delete.", error: true });
        }
      },
    });

  return (
    <LibraryProvider>
      <EncounterTitle name={encounter.name} onCommit={(name) => dispatch({ type: "setName", name })} />
      <Toolbar
        round={encounter.round}
        dispatch={dispatch}
        dirty={dirty}
        saving={saving}
        onSave={() => void doSave()}
        onNew={() => guard("Start a new encounter?", "New encounter", () => load(newEncounter()))}
      >
        <OpenMenu list={list} lastSlug={last} error={listError} onOpenMenu={() => void refreshList()} onPick={open} onDelete={remove} />
      </Toolbar>
      <CombatTable encounter={encounter} dispatch={dispatch} />
      <div className={status.error ? "status error" : "status"} role="status">
        {status.text}
      </div>
      <footer>
        Icons: <a href="https://game-icons.net" target="_blank" rel="noreferrer">game-icons.net</a> (CC BY 3.0). See CREDITS.md.
      </footer>
      {pending && (
        <ConfirmDialog
          message={pending.message}
          confirmLabel={pending.confirmLabel}
          onCancel={() => setPending(null)}
          onConfirm={() => {
            const run = pending.run;
            setPending(null);
            run();
          }}
        />
      )}
    </LibraryProvider>
  );
}
