import { copyFile, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";

import writeFile from "write-file-atomic";

import type { ItemResult } from "./engine.js";

const indexById = async (
  results: readonly ItemResult[],
  outputDirectory: string,
) => {
  const byIdDir = join(outputDirectory, "by-id");

  // Unsubtle
  await rm(byIdDir, { recursive: true, force: true });
  await mkdir(byIdDir, { recursive: true });

  await Promise.all(
    results.map(async (result) => {
      const summaryFile = join(byIdDir, `${result.item.id}.summary.txt`);

      const okResult = [result.result1, result.result2].find(
        (r) => r?.result === "ok",
      );

      const summaryText = okResult
        ? `Downloaded from ${okResult.cachedHead.url}\n`
        : `Failed to download\n`;

      await writeFile(summaryFile, summaryText, "utf-8");

      if (okResult) {
        await copyFile(
          okResult.bodyPath,
          join(byIdDir, `${result.item.id}.document.pdf`),
        );
      }
    }),
  );
};

export default indexById;
