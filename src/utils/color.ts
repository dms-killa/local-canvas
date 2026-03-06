export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface RGBA extends RGB {
  a: number;
}

/**
 * Parses a CSS hex color string (#RGB, #RRGGBB) into an RGB object.
 * Throws if the string is not a valid hex color.
 */
export function hexToRgb(hex: string): RGB {
  const normalized = hex.startsWith("#") ? hex.slice(1) : hex;

  const isValidHex = (s: string) => /^[0-9a-fA-F]+$/.test(s);

  if (normalized.length === 3 && isValidHex(normalized)) {
    const [r, g, b] = normalized.split("").map((c) => parseInt(c + c, 16));
    return { r, g, b };
  }

  if (normalized.length === 6 && isValidHex(normalized)) {
    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);
    return { r, g, b };
  }

  throw new Error(`Invalid hex color: "${hex}"`);
}

/**
 * Converts an RGB object to a CSS hex string (#rrggbb).
 * Channel values are clamped to [0, 255] and rounded.
 */
export function rgbToHex({ r, g, b }: RGB): string {
  const toHex = (n: number) =>
    Math.round(Math.min(255, Math.max(0, n)))
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Calculates the relative luminance of an RGB color (WCAG 2.1 formula).
 * Returns a value in [0, 1].
 */
export function relativeLuminance({ r, g, b }: RGB): number {
  const linearize = (channel: number) => {
    const s = channel / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/**
 * Calculates the WCAG 2.1 contrast ratio between two colors.
 * Returns a value in [1, 21].
 */
export function contrastRatio(fg: RGB, bg: RGB): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
