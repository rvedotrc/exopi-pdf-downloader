import assert from "node:assert";
import { beforeEach, describe, it } from "node:test";

import mockFs from "mock-fs";

import { loadItems } from "../src/items.js";

void describe("items", () => {
  beforeEach(() => {});

  void it("loads a simple CSV file", async () => {
    mockFs({
      "somefile.csv": "id,url,alt url\n44,https://example.org/,\n",
    });

    assert.deepStrictEqual(await loadItems("somefile.csv"), [
      {
        id: "44",
        url: "https://example.org/",
        altUrl: null,
      },
    ]);
  });

  void it("discards trailing empty rows", async () => {
    mockFs({
      "somefile.csv": "id,url,alt url\n44,https://example.org/,\n,,\n,,\n",
    });

    assert.deepStrictEqual(await loadItems("somefile.csv"), [
      {
        id: "44",
        url: "https://example.org/",
        altUrl: null,
      },
    ]);
  });

  void it("discards a BOM", async () => {
    mockFs({
      "somefile.csv": "\uFEFFid,url,alt url\n44,https://example.org/,\n",
    });

    assert.deepStrictEqual(await loadItems("somefile.csv"), [
      {
        id: "44",
        url: "https://example.org/",
        altUrl: null,
      },
    ]);
  });

  void it("can handle CRLF", async () => {
    mockFs({
      "somefile.csv": "id,url,alt url\r\n44,https://example.org/,\r\n",
    });

    assert.deepStrictEqual(await loadItems("somefile.csv"), [
      {
        id: "44",
        url: "https://example.org/",
        altUrl: null,
      },
    ]);
  });

  void it("can handle a more complex file", async () => {
    mockFs({
      "somefile.csv":
        "id,url,alt url\n" +
        "44,https://example.org/,\n" +
        "45,https://example.net/,https://example.com/\n",
    });

    assert.deepStrictEqual(await loadItems("somefile.csv"), [
      {
        id: "44",
        url: "https://example.org/",
        altUrl: null,
      },
      {
        id: "45",
        url: "https://example.net/",
        altUrl: "https://example.com/",
      },
    ]);
  });

  void describe("checking the headers", () => {
    const itAccepts = async (content: string) => {
      mockFs({ "somefile.csv": content });
      await assert.doesNotReject(loadItems("somefile.csv"));
    };

    const itRejects = async (content: string) => {
      mockFs({ "somefile.csv": content });
      await assert.rejects(loadItems("somefile.csv"));
    };

    void it("accepts id,url,alt url", () => itAccepts("id,url,alt url\n"));

    void it("rejects alt_url", () => itRejects("id,url,alt_url\n"));

    // Obviously we can't test for *all* not-correct headers :-)
    void it("rejects extra columns", () => itRejects("id,url,alt url,boo\n"));
  });
});
