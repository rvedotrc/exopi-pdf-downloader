import type { CachedHead, DownloaderCache } from "./downloaderCache.js";
import type { Item } from "./items.js";
import type { URLFetcher } from "./urlFetcher.js";

export type UrlResult =
  | {
      readonly result: "not_ok";
      readonly cachedHead: CachedHead;
    }
  | {
      readonly result: "ok";
      readonly cachedHead: CachedHead;
      readonly bodyPath: string;
    };

export type ItemResult = {
  readonly item: Item;
  readonly result1: UrlResult;
  readonly result2: UrlResult | null;
};

export const createEngine = (
  urlFetcher: URLFetcher,
  cache: DownloaderCache,
  cachedOrRequest: (typeof import("./cachedOrRequest.js"))["default"],
  logger = console,
) => {
  const tryUrl = async (url: string): Promise<UrlResult> => {
    return await cachedOrRequest(url, urlFetcher, cache, logger);
  };

  const tryUrlCache = new Map<string, ReturnType<typeof tryUrl>>();

  const cachedTryUrl: typeof tryUrl = (url) => {
    let promise = tryUrlCache.get(url);
    if (promise) {
      logger.debug(`Using cached promise for ${url}`);
      return promise;
    }

    promise = tryUrl(url);
    tryUrlCache.set(url, promise);
    return promise;
  };

  const tryItem = async (item: Item): Promise<ItemResult> => {
    const result1 = await cachedTryUrl(item.url);
    const result2 =
      result1.result !== "ok" && item.altUrl
        ? await cachedTryUrl(item.altUrl)
        : null;
    return { item, result1, result2 };
  };

  return {
    tryItem,
  };
};
