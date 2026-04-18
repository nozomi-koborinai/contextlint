import { describe, it, expect } from "bun:test";
import { uriToPath } from "./uri.js";

describe("uriToPath", () => {
  it("strips the file:// prefix", () => {
    expect(uriToPath("file:///tmp/foo.md")).toBe("/tmp/foo.md");
  });

  it("decodes percent-encoded characters", () => {
    expect(uriToPath("file:///tmp/%E6%97%A5%E6%9C%AC%E8%AA%9E.md")).toBe(
      "/tmp/日本語.md",
    );
  });

  it("returns non-file URIs unchanged", () => {
    expect(uriToPath("untitled:Untitled-1")).toBe("untitled:Untitled-1");
  });

  it("preserves spaces and special chars through decoding", () => {
    expect(uriToPath("file:///tmp/my%20doc.md")).toBe("/tmp/my doc.md");
  });
});
