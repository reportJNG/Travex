import { describe, expect, it } from "vitest";
import { camelize, unwrapRpcSingle } from "./shape";

describe("shape helpers", () => {
  it("camelizes nested Supabase rows", () => {
    expect(
      camelize({
        created_at: "2026-07-04",
        hotel_photos: [{ storage_path: "hotel-media/demo.jpg" }],
      }),
    ).toEqual({
      createdAt: "2026-07-04",
      hotelPhotos: [{ storagePath: "hotel-media/demo.jpg" }],
    });
  });

  it("unwraps RPC array responses", () => {
    expect(unwrapRpcSingle([{ id: "abc" }])).toEqual({ id: "abc" });
  });
});
