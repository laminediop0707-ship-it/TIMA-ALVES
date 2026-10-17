import { describe, expect, it } from "vitest";
import { detectMimeFromBytes } from "./storage";

function buffer(...bytes: number[]): Buffer {
  return Buffer.from([...bytes, ...new Array(16).fill(0)]);
}

describe("detectMimeFromBytes", () => {
  it("detects JPEG", () => {
    expect(detectMimeFromBytes(buffer(0xff, 0xd8, 0xff, 0xe0))).toBe("image/jpeg");
  });

  it("detects PNG", () => {
    expect(detectMimeFromBytes(buffer(0x89, 0x50, 0x4e, 0x47))).toBe("image/png");
  });

  it("detects WebP", () => {
    const bytes = [
      ...Buffer.from("RIFF", "ascii"),
      0x00,
      0x00,
      0x00,
      0x00,
      ...Buffer.from("WEBP", "ascii"),
    ];
    expect(detectMimeFromBytes(Buffer.from([...bytes, ...new Array(8).fill(0)]))).toBe(
      "image/webp",
    );
  });

  it("detects GIF", () => {
    const bytes = [
      ...Buffer.from("GIF89a", "ascii"),
      ...new Array(10).fill(0),
    ];
    expect(detectMimeFromBytes(Buffer.from(bytes))).toBe("image/gif");
  });

  it("detects MP4 via ftyp brand", () => {
    const bytes = [
      0x00,
      0x00,
      0x00,
      0x18,
      ...Buffer.from("ftyp", "ascii"),
      ...Buffer.from("isom", "ascii"),
      ...new Array(8).fill(0),
    ];
    expect(detectMimeFromBytes(Buffer.from(bytes))).toBe("video/mp4");
  });

  it("detects AVIF via ftyp brand", () => {
    const bytes = [
      0x00,
      0x00,
      0x00,
      0x18,
      ...Buffer.from("ftyp", "ascii"),
      ...Buffer.from("avif", "ascii"),
      ...new Array(8).fill(0),
    ];
    expect(detectMimeFromBytes(Buffer.from(bytes))).toBe("image/avif");
  });

  it("detects WebM via EBML header", () => {
    expect(detectMimeFromBytes(buffer(0x1a, 0x45, 0xdf, 0xa3))).toBe("video/webm");
  });

  it("rejects an executable renamed as an image", () => {
    const mz = [
      ...Buffer.from("MZ", "ascii"),
      ...Buffer.from("This is a windows executable", "ascii"),
    ];
    expect(detectMimeFromBytes(Buffer.from(mz))).toBeNull();
  });

  it("rejects a plain text file", () => {
    expect(detectMimeFromBytes(Buffer.from("just some text content here"))).toBeNull();
  });

  it("rejects a too-small buffer", () => {
    expect(detectMimeFromBytes(Buffer.from([0xff, 0xd8]))).toBeNull();
  });
});
