import { clamp, lerp, mapRange, toDegrees, toRadians } from "../math";

describe("clamp", () => {
  it("returns the value when it is within range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it("returns min when value is below range", () => {
    expect(clamp(-1, 0, 10)).toBe(0);
  });

  it("returns max when value is above range", () => {
    expect(clamp(11, 0, 10)).toBe(10);
  });

  it("returns the value when it equals min", () => {
    expect(clamp(0, 0, 10)).toBe(0);
  });

  it("returns the value when it equals max", () => {
    expect(clamp(10, 0, 10)).toBe(10);
  });

  it("handles negative ranges", () => {
    expect(clamp(-5, -10, -1)).toBe(-5);
    expect(clamp(0, -10, -1)).toBe(-1);
    expect(clamp(-20, -10, -1)).toBe(-10);
  });

  it("throws when min > max", () => {
    expect(() => clamp(5, 10, 0)).toThrow(RangeError);
    expect(() => clamp(5, 10, 0)).toThrow("min (10) must be <= max (0)");
  });

  it("works when min === max", () => {
    expect(clamp(5, 3, 3)).toBe(3);
  });
});

describe("lerp", () => {
  it("returns a at t=0", () => {
    expect(lerp(0, 100, 0)).toBe(0);
  });

  it("returns b at t=1", () => {
    expect(lerp(0, 100, 1)).toBe(100);
  });

  it("returns midpoint at t=0.5", () => {
    expect(lerp(0, 100, 0.5)).toBe(50);
  });

  it("extrapolates when t < 0", () => {
    expect(lerp(0, 10, -1)).toBe(-10);
  });

  it("extrapolates when t > 1", () => {
    expect(lerp(0, 10, 2)).toBe(20);
  });

  it("works with negative values", () => {
    expect(lerp(-50, 50, 0.5)).toBe(0);
  });
});

describe("mapRange", () => {
  it("maps a value from one range to another", () => {
    expect(mapRange(5, 0, 10, 0, 100)).toBe(50);
  });

  it("maps the minimum of the input range to the minimum of the output range", () => {
    expect(mapRange(0, 0, 10, 0, 100)).toBe(0);
  });

  it("maps the maximum of the input range to the maximum of the output range", () => {
    expect(mapRange(10, 0, 10, 0, 100)).toBe(100);
  });

  it("supports inverted output ranges", () => {
    expect(mapRange(0, 0, 10, 100, 0)).toBe(100);
    expect(mapRange(10, 0, 10, 100, 0)).toBe(0);
    expect(mapRange(5, 0, 10, 100, 0)).toBe(50);
  });

  it("supports negative input ranges", () => {
    expect(mapRange(0, -10, 10, 0, 100)).toBe(50);
  });

  it("throws when inMin === inMax", () => {
    expect(() => mapRange(5, 3, 3, 0, 100)).toThrow(RangeError);
    expect(() => mapRange(5, 3, 3, 0, 100)).toThrow(
      "Input range cannot be zero-width"
    );
  });
});

describe("toRadians", () => {
  it("converts 0 degrees to 0 radians", () => {
    expect(toRadians(0)).toBe(0);
  });

  it("converts 180 degrees to PI radians", () => {
    expect(toRadians(180)).toBeCloseTo(Math.PI);
  });

  it("converts 360 degrees to 2*PI radians", () => {
    expect(toRadians(360)).toBeCloseTo(2 * Math.PI);
  });

  it("converts 90 degrees to PI/2 radians", () => {
    expect(toRadians(90)).toBeCloseTo(Math.PI / 2);
  });

  it("handles negative degrees", () => {
    expect(toRadians(-180)).toBeCloseTo(-Math.PI);
  });
});

describe("toDegrees", () => {
  it("converts 0 radians to 0 degrees", () => {
    expect(toDegrees(0)).toBe(0);
  });

  it("converts PI radians to 180 degrees", () => {
    expect(toDegrees(Math.PI)).toBeCloseTo(180);
  });

  it("converts 2*PI radians to 360 degrees", () => {
    expect(toDegrees(2 * Math.PI)).toBeCloseTo(360);
  });

  it("is the inverse of toRadians", () => {
    expect(toDegrees(toRadians(45))).toBeCloseTo(45);
    expect(toDegrees(toRadians(270))).toBeCloseTo(270);
  });
});
