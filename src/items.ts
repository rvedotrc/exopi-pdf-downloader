import assert from "node:assert";
import { readFile } from "node:fs/promises";

import * as csv from "csv/sync";

export type Item = {
  readonly id: string;
  readonly url: string;
  readonly altUrl: string | null;
};

const parseRow = (row: readonly string[]): Item => {
  const [id, url, altUrl, more] = row;

  assert(typeof id === "string");
  assert(typeof url === "string");
  assert(typeof altUrl == "string" || (altUrl as unknown) === undefined);
  assert(more === undefined);

  return {
    id,
    url,
    altUrl: row[2] || null,
  };
};

export const loadItems = async (
  specCSVFile: string,
): Promise<readonly Item[]> => {
  // Strip BOM if present
  const fileText = (await readFile(specCSVFile, "utf-8")).replace(
    /^\uFEFF/,
    "",
  );

  // Parse CSV and discard any all-blank rows
  const data = csv.parse(fileText).filter((row) => row.some(Boolean));

  // Check and discard header row

  assert.deepStrictEqual(data[0], ["id", "url", "alt url"]);

  data.shift();

  return data.map(parseRow);
};
