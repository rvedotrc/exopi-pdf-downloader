import type { CachedHead, DownloaderCache } from "./downloaderCache.js";
import type { UrlResult } from "./engine.js";
import type { URLFetcher } from "./urlFetcher.js";
import urlToHash from "./urlToHash.js";

const isPdf = (h: CachedHead | null) =>
  h && h.status === 200 && h.headers["content-type"] === "application/pdf";

export default async (
  url: string,
  urlFetcher: URLFetcher,
  cache: DownloaderCache,
  logger = console,
): Promise<UrlResult> => {
  const hash = urlToHash(url);

  let cachedHead = await cache.loadHead({ hash });
  let cachedBody = await cache.testBody({ hash });

  logger.debug(
    "%s",
    `${hash} c-s=${cachedHead?.status ?? "-"} c-pdf=${isPdf(cachedHead) ? "y" : "n"} c-b=${cachedBody.exists ? "y" : "n"} url=${url}`,
  );

  if (cachedHead) {
    if (isPdf(cachedHead)) {
      if (cachedBody.exists) {
        logger.debug("%s", `${hash} ok (cached)`);
        return {
          result: "ok",
          cachedHead,
          bodyPath: cachedBody.path,
        };
      }
    } else {
      logger.debug("%s", `${hash} not_ok (cached)`);
      return {
        result: "not_ok",
        cachedHead,
      };
    }
  }

  logger.debug(`${hash} GET ${url}`);
  const response = await urlFetcher.fetchUrl(url);
  logger.debug(`${hash} GET ${url} =>`, response.status, response.statusText);

  cachedHead = {
    url,
    status: response.status,
    headers: response.headers as CachedHead["headers"],
  };

  if (isPdf(cachedHead)) {
    logger.info(hash, "got a body to save", url);
    const cachedBodyOrError = await cache.saveBody(response.data, hash);

    if (cachedBodyOrError.error) {
      cachedHead = {
        url,
        status: 500,
        headers: {
          "x-error-while-streaming": cachedBodyOrError.error.name,
        },
      };
    } else {
      cachedBody = cachedBodyOrError;

      logger.debug(hash, "body saved ok", url);

      await cache.saveHead({ hash, cachedHead });

      logger.debug(`${hash} ok (fetched)`);
      return {
        result: "ok",
        cachedHead,
        bodyPath: cachedBody.path,
      };
    }
  }

  // We cache the head, but not the body
  await cache.saveHead({ hash, cachedHead });

  logger.debug(`${hash} not_ok (fetched)`);

  return { result: "not_ok", cachedHead };
};
