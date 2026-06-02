import { describe, expect, it } from "vitest";
import { getMachineKey } from "./constants";

describe("getMachineKey", () => {
  it("normalizes common role formats", () => {
    expect(getMachineKey("KUTU DOLUM")).toBe("dolum");
    expect(getMachineKey("kutu dolum")).toBe("dolum");
    expect(getMachineKey("PET DOLUM")).toBe("pet_dolum");
    expect(getMachineKey("Cam Paketleme")).toBe("cam_paketleme");
  });
});

