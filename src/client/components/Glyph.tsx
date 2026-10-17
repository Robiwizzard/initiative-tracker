import { Icon } from "./Icon";

/** An uploaded image (shown as is) or a bundled game-icons SVG (tinted by the theme). */
export function Glyph({ image, url, small }: { image?: string; url: string; small?: boolean }) {
  if (image) return <img className={small ? "icon-img sm" : "icon-img"} src={image} alt="" aria-hidden="true" />;
  return <Icon url={url} small={small} />;
}
