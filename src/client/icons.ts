const classUrls = import.meta.glob("./assets/icons/classes/*.svg", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
const condUrls = import.meta.glob("./assets/icons/conditions/*.svg", { eager: true, query: "?url", import: "default" }) as Record<string, string>;

const byId = (m: Record<string, string>) =>
  Object.fromEntries(Object.entries(m).map(([k, v]) => [k.split("/").pop()!.replace(".svg", ""), v]));

export const CLASS_ICON_URL = byId(classUrls);
export const CONDITION_ICON_URL = byId(condUrls);
