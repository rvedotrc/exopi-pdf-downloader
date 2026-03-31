import assert from "node:assert";
import { describe, it } from "node:test";

import urlToHash from "../src/urlToHash.js";

void describe("urlToHash", () => {
  void it("hashes a URL", () => {
    const hash = urlToHash("https://example.com/");
    assert.deepStrictEqual(
      hash,
      "0f115db062b7c0dd030b16878c99dea5c354b49dc37b38eb8846179c7783e9d7",
    );
  });
});
