import assert from "node:assert";
import { describe, it } from "node:test";

import { ensureError } from "../src/fp.js";

void describe("fp", () => {
  void describe("ensureError", () => {
    void it("returns an Error as-is", () => {
      const error = new RangeError("bang!");
      const output = ensureError(error);
      assert.equal(output, error);
    });

    void it("wraps a non-Error as an error", () => {
      const notAnError = { message: "bang!" };
      const output = ensureError(notAnError);
      assert(output instanceof Error);
      assert.equal(output.cause, notAnError);
    });
  });
});
