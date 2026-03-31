import { createWriteStream } from "node:fs";
import { mkdir, readFile, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

import { protoSafeParse } from "@blaahaj/json";
import { remapErrno } from "@blaahaj/remap-errno";
import writeFile from "write-file-atomic";

import { ensureError } from "./fp.js";

export type CachedHead = {
  readonly url: string;
  readonly status: number;
  readonly headers: {
    readonly [_ in string]: string | readonly string[];
  };
};

const readFileOrNull = remapErrno(readFile, { ENOENT: null });

const pathExists = (path: string) =>
  remapErrno(stat, { ENOENT: null })(path).then((r) => (r ? true : false));

export const createCache = (baseDir: string, logger = console) => {
  const cachedHeadPath = (hash: string) =>
    resolve(baseDir, "hash", hash, "head.json");

  const cachedBodyPath = (hash: string) =>
    resolve(baseDir, "hash", hash, "body");

  const loadHead = ({ hash }: { hash: string }): Promise<CachedHead | null> =>
    readFileOrNull(cachedHeadPath(hash), "utf-8").then((t) =>
      t ? protoSafeParse(t.toString()) : null,
    );

  const saveHead = async ({
    hash,
    cachedHead,
  }: {
    hash: string;
    cachedHead: CachedHead;
  }) => {
    const path = cachedHeadPath(hash);
    logger.debug("write", path);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, JSON.stringify(cachedHead) + "\n", "utf-8");
  };

  const testBody = async ({ hash }: { hash: string }) => {
    const path = cachedBodyPath(hash);
    logger.debug("test", path);
    return {
      path,
      exists: await pathExists(path),
    } as const;
  };

  const saveBody = async (readable: Readable, hash: string) => {
    const path = cachedBodyPath(hash);
    logger.debug("write", path);
    await mkdir(dirname(path), { recursive: true });

    // We can hit an error here, e.g. if the response that we're streaming from times out
    const error = await pipeline(readable, createWriteStream(path)).then(
      () => null,
      ensureError,
    );

    if (error) {
      return { error } as const;
    }

    return {
      error: null,
      path,
      exists: true,
    } as const;
  };

  return {
    loadHead,
    saveHead,
    testBody,
    saveBody,
  } as const;
};

export type DownloaderCache = ReturnType<typeof createCache>;
