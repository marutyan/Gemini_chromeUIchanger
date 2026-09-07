declare function require(name: string): any;

namespace ManifestTests {
  const assert = require("node:assert/strict");
  const fs = require("node:fs");
  const test = require("node:test");

  interface Manifest {
    manifest_version: number;
    permissions?: string[];
    content_scripts?: Array<{ matches?: string[] }>;
  }

  test("manifest limits permissions and host scope", () => {
    const manifest = JSON.parse(
      fs.readFileSync("dist/manifest.json", "utf8"),
    ) as Manifest;

    assert.equal(manifest.manifest_version, 3);
    assert.deepEqual(manifest.permissions, ["storage"]);
    assert.deepEqual(manifest.content_scripts?.[0]?.matches, [
      "https://gemini.google.com/*",
    ]);
  });
}
