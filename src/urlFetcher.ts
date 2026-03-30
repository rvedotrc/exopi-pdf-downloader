import { errnoOf } from "@blaahaj/remap-errno";
import { Axios, type AxiosResponse } from "axios";

const MAX_RESPONSE_CONTENT_LENGTH = 50 << 20;
const CONNECT_TIMEOUT = 5000;
const REQUEST_TIMEOUT = 30000;

export const createUrlFetcher = () => {
  const axios = new Axios({
    headers: {
      "User-Agent": "Exopi Consulting pdf-downloader",
    },
    // "maxBodyLength" applies to the request
    // "maxContentLength" applies to the response
    // Not the clearest naming ever
    maxContentLength: MAX_RESPONSE_CONTENT_LENGTH,
  });

  const fetchUrl = async (url: string) => {
    return await axios
      .request({
        method: "GET",
        url,
        timeout: CONNECT_TIMEOUT,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT),
        responseType: "stream",
      })
      .catch(
        // We turn rejections into a synthesised HTTP error response
        // so that we can cache them in the same way that we do for
        // actual HTTP errors. Whether or not we we /should/ cache them
        // like this, is a different question :-)
        (error: Error): AxiosResponse => ({
          status: 500,
          statusText: `${error.message} (synthesised)`,
          headers: {
            "x-synthesised-error-name": error.name,
            "x-synthesised-error-message": error.message,
            "x-synthesised-error-errno": errnoOf(error),
          },
          data: null,
          config: null as any,
        }),
      );
  };

  return {
    fetchUrl,
  };
};

export type URLFetcher = ReturnType<typeof createUrlFetcher>;
