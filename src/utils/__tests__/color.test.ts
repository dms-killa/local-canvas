import {
  contrastRatio,
  hexToRgb,
  relativeLuminance,
  rgbToHex,
} from "../color";

describe("hexToRgb", () => {
  it("parses a 6-digit hex string with leading #", () => {
    expect(hexToRgb("#ff0000")).toEqual({ r: 255, g: 0, b: 0 });
  });

  it("parses a 6-digit hex string without leading #", () => {
    expect(hexToRgb("00ff00")).toEqual({ r: 0, g: 255, b: 0 });
  });

  it("parses a 3-digit hex shorthand", () => {
    expect(hexToRgb("#f00")).toEqual({ r: 255, g: 0, b: 0 });
    expect(hexToRgb("#0f0")).toEqual({ r: 0, g: 255, b: 0 });
    expect(hexToRgb("#fff")).toEqual({ r: 255, g: 255, b: 255 });
  });

  it("parses black and white correctly", () => {
    expect(hexToRgb("#000000")).toEqual({ r: 0, g: 0, b: 0 });
    expect(hexToRgb("#ffffff")).toEqual({ r: 255, g: 255, b: 255 });
  });

  it("parses mixed-case hex strings", () => {
    expect(hexToRgb("#FF8800")).toEqual({ r: 255, g: 136, b: 0 });
  });

  it("throws for invalid hex strings", () => {
    expect(() => hexToRgb("#gg0000")).toThrow('Invalid hex color: "#gg0000"');
    expect(() => hexToRgb("#12345")).toThrow();
    expect(() => hexToRgb("")).toThrow();
    expect(() => hexToRgb("#1234567")).toThrow();
  });
});

describe("rgbToHex", () => {
  it("converts red to #ff0000", () => {
    expect(rgbToHex({ r: 255, g: 0, b: 0 })).toBe("#ff0000");
  });

  it("converts black to #000000", () => {
    expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe("#000000");
  });

  it("converts white to #ffffff", () => {
    expect(rgbToHex({ r: 255, g: 255, b: 255 })).toBe("#ffffff");
  });

  it("pads single hex digits with a leading zero", () => {
    expect(rgbToHex({ r: 0, g: 15, b: 16 })).toBe("#000f10");
  });

  it("clamps channel values above 255", () => {
    expect(rgbToHex({ r: 300, g: 0, b: 0 })).toBe("#ff0000");
  });

  it("clamps channel values below 0", () => {
    expect(rgbToHex({ r: -10, g: 0, b: 0 })).toBe("#000000");
  });

  it("round-trips with hexToRgb", () => {
    const original = "#1a2b3c";
    expect(rgbToHex(hexToRgb(original))).toBe(original);
  });
});

describe("relativeLuminance", () => {
  it("returns 0 for black", () => {
    expect(relativeLuminance({ r: 0, g: 0, b: 0 })).toBe(0);
  });

  it("returns 1 for white", () => {
    expect(relativeLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1);
  });

  it("returns a value between 0 and 1 for other colors", () => {
    const lum = relativeLuminance({ r: 128, g: 64, b: 200 });
    expect(lum).toBeGreaterThan(0);
    expect(lum).toBeLessThan(1);
  });

  it("green is brighter than red which is brighter than blue (WCAG weights)", () => {
    const lumGreen = relativeLuminance({ r: 0, g: 255, b: 0 });
    const lumRed = relativeLuminance({ r: 255, g: 0, b: 0 });
    const lumBlue = relativeLuminance({ r: 0, g: 0, b: 255 });
    expect(lumGreen).toBeGreaterThan(lumRed);
    expect(lumRed).toBeGreaterThan(lumBlue);
  });
});

describe("contrastRatio", () => {
  it("returns 21 for black on white", () => {
    const black = { r: 0, g: 0, b: 0 };
    const white = { r: 255, g: 255, b: 255 };
    expect(contrastRatio(black, white)).toBeCloseTo(21, 0);
  });

  it("returns 1 when foreground and background are the same color", () => {
    const color = { r: 100, g: 150, b: 200 };
    expect(contrastRatio(color, color)).toBeCloseTo(1);
  });

  it("is symmetric (fg/bg order does not change ratio)", () => {
    const fg = { r: 255, g: 0, b: 0 };
    const bg = { r: 0, g: 0, b: 128 };
    expect(contrastRatio(fg, bg)).toBeCloseTo(contrastRatio(bg, fg));
  });

  it("returns a ratio >= 1 in all cases", () => {
    const pairs: [{ r: number; g: number; b: number }, { r: number; g: number; b: number }][] = [
      [{ r: 0, g: 0, b: 0 }, { r: 0, g: 0, b: 0 }],
      [{ r: 255, g: 255, b: 255 }, { r: 255, g: 255, b: 255 }],
      [{ r: 128, g: 64, b: 32 }, { r: 200, g: 220, b: 240 }],
    ];
    for (const [fg, bg] of pairs) {
      expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(1);
    }
  });

  it("meets WCAG AA large-text threshold (3:1) for black on mid-gray", () => {
    // #767676 is approximately the boundary for WCAG AA normal text
    const black = { r: 0, g: 0, b: 0 };
    const midGray = { r: 118, g: 118, b: 118 };
    expect(contrastRatio(black, midGray)).toBeGreaterThanOrEqual(3);
  });
});
