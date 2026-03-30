import { join } from "node:path";

import writeFile from "write-file-atomic";

import { createCache } from "./downloaderCache.js";
import { createEngine, type ItemResult } from "./engine.js";
import indexById from "./indexById.js";
import { loadItems } from "./items.js";
import { makePromiseLimiter } from "./promiseLimiter.js";
import { createUrlFetcher } from "./urlFetcher.js";

const CONCURRENCY = 10;

const run = async (specCSVFile: string, outputDirectory: string) => {
  const items = await loadItems(specCSVFile);
  const cache = createCache(outputDirectory);
  const urlFetcher = createUrlFetcher();
  const engine = createEngine(urlFetcher, cache);

  const limiter = makePromiseLimiter<ItemResult>(
    CONCURRENCY,
    "pdf-downloader",
    true,
  );

  const allResults = await Promise.all(
    items.map((item) =>
      limiter.submit(() => engine.tryItem(item), `${item.id} ${item.url}`),
    ),
  );

  await indexById(allResults, outputDirectory);

  const jsonText = JSON.stringify(allResults);
  await writeFile(
    join(outputDirectory, "all-results.json"),
    jsonText + "\n",
    "utf-8",
  );

  for (const result of allResults) {
    const okResult = [result.result1, result.result2].find(
      (r) => r?.result === "ok",
    );

    console.log(
      result.item.id.padEnd(7),
      result.result1.result.padEnd(7),
      (result.result2?.result ?? "-").padEnd(7),
      (
        (okResult?.cachedHead.headers["content-length"] ?? "-") as string
      ).padStart(10),
      okResult?.bodyPath ?? "-",
    );
  }
};

const [specCSVFile, outputDirectory] = process.argv.slice(2) as [
  string,
  string,
];

run(specCSVFile, outputDirectory).catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
