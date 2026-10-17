import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { EMPTY_LIBRARY } from "../../shared/types";
import type { CustomCondition, CustomIcon, CustomLibrary } from "../../shared/types";
import { makeId } from "../../shared/ids";

interface LibraryApi {
  library: CustomLibrary;
  error: string | null;
  addIcon: (name: string, dataUrl: string) => CustomIcon;
  removeIcon: (id: string) => void;
  saveCondition: (c: Omit<CustomCondition, "id"> & { id?: CustomCondition["id"] }) => CustomCondition;
  removeCondition: (id: string) => void;
}

const noop: LibraryApi = {
  library: EMPTY_LIBRARY,
  error: null,
  addIcon: (name, dataUrl) => ({ id: "x", name, dataUrl }),
  removeIcon: () => {},
  saveCondition: (c) => ({ ...c, id: c.id ?? "custom:x" }),
  removeCondition: () => {},
};

const Ctx = createContext<LibraryApi>(noop);
export const useLibrary = () => useContext(Ctx);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [library, setLibrary] = useState<CustomLibrary>(EMPTY_LIBRARY);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef(library);

  useEffect(() => {
    fetch("/api/custom")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((lib: CustomLibrary) => {
        ref.current = lib;
        setLibrary(lib);
      })
      .catch(() => setError("Could not load your custom icons and conditions."));
  }, []);

  const commit = useCallback((next: CustomLibrary) => {
    ref.current = next;
    setLibrary(next);
    fetch("/api/custom", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(next) })
      .then((r) => {
        if (!r.ok) throw new Error();
        setError(null);
      })
      .catch(() => setError("Could not save your custom icons and conditions."));
  }, []);

  const api = useMemo<LibraryApi>(
    () => ({
      library,
      error,
      addIcon(name, dataUrl) {
        const existing = ref.current.icons.find((i) => i.dataUrl === dataUrl);
        if (existing) return existing;
        const icon = { id: makeId(), name: name.slice(0, 100), dataUrl };
        commit({ ...ref.current, icons: [...ref.current.icons, icon] });
        return icon;
      },
      removeIcon(id) {
        commit({ ...ref.current, icons: ref.current.icons.filter((i) => i.id !== id) });
      },
      saveCondition(c) {
        const cond: CustomCondition = { ...c, id: c.id ?? (`custom:${makeId()}` as const) };
        const has = ref.current.conditions.some((x) => x.id === cond.id);
        commit({
          ...ref.current,
          conditions: has ? ref.current.conditions.map((x) => (x.id === cond.id ? cond : x)) : [...ref.current.conditions, cond],
        });
        return cond;
      },
      removeCondition(id) {
        commit({ ...ref.current, conditions: ref.current.conditions.filter((c) => c.id !== id) });
      },
    }),
    [library, error, commit],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}
