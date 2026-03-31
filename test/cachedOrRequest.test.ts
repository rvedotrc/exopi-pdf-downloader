import assert from "node:assert";
import { Readable, Writable } from "node:stream";
import { describe, it, type Mock, type TestContext } from "node:test";

import { AxiosHeaders, type AxiosResponse } from "axios";

import cachedOrRequest from "../src/cachedOrRequest.js";
import { createCache, type DownloaderCache } from "../src/downloaderCache.js";
import { doThrow } from "../src/fp.js";
import { createUrlFetcher, type URLFetcher } from "../src/urlFetcher.js";
import urlToHash from "../src/urlToHash.js";

type MockedFunctions<T> = {
  [k in keyof T]: T[k] extends Function ? Mock<T[k]> : T[k];
};

const nullLogger = new console.Console(new Writable(), new Writable(), true);

void describe("cachedOrRequest", () => {
  let downloaderCache: MockedFunctions<DownloaderCache>;
  let urlFetcher: MockedFunctions<URLFetcher>;
  const url = "some-url";

  const noImplementation = () =>
    doThrow(new Error("No implementation provided"));

  const setup = (t: TestContext) => {
    downloaderCache = createCache(
      "some-dir",
      //   nullLogger,
    ) as MockedFunctions<DownloaderCache>;
    t.mock.method(downloaderCache, "loadHead", noImplementation);
    t.mock.method(downloaderCache, "saveHead", noImplementation);
    t.mock.method(downloaderCache, "testBody", noImplementation);
    t.mock.method(downloaderCache, "saveBody", noImplementation);

    urlFetcher = createUrlFetcher() as MockedFunctions<URLFetcher>;
    t.mock.method(urlFetcher, "fetchUrl", noImplementation);
  };

  const givenHeadIsCached = (status: number, contentType: string) => {
    downloaderCache.loadHead.mock.mockImplementationOnce((({ hash: _hash }) => {
      return Promise.resolve({
        url,
        status,
        headers: {
          "content-type": contentType,
        },
      });
    }) satisfies DownloaderCache["loadHead"]);
  };

  const givenHeadIsNotCached = () => {
    downloaderCache.loadHead.mock.mockImplementationOnce(({ hash: _hash }) => {
      return Promise.resolve(null);
    });
  };

  const givenBody = (exists: boolean, path: string) => {
    downloaderCache.testBody.mock.mockImplementationOnce((({ hash: _hash }) => {
      return Promise.resolve({
        exists,
        path,
      });
    }) satisfies DownloaderCache["testBody"]);
  };

  const givenResponse = (
    status: number,
    contentType: string,
    data?: Readable,
  ) => {
    const headers = new AxiosHeaders();
    headers.setContentType(contentType);

    const response: AxiosResponse = {
      data,
      status,
      statusText: "",
      headers: {
        "content-type": contentType,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      config: undefined as any,
    };

    urlFetcher.fetchUrl.mock.mockImplementationOnce(() =>
      Promise.resolve(response),
    );
  };

  // cached 200-pdf with body => return it
  void it("returns an already-cached success response", async (t) => {
    setup(t);
    givenHeadIsCached(200, "application/pdf");
    givenBody(true, "some-file");
    downloaderCache.saveHead.mock.mockImplementationOnce(() =>
      Promise.resolve(),
    );
    downloaderCache.saveBody.mock.mockImplementationOnce(() =>
      Promise.resolve({ error: null, path: "some-file", exists: true }),
    );

    const result = await cachedOrRequest(
      url,
      urlFetcher,
      downloaderCache,
      nullLogger,
    );

    assert.equal(urlFetcher.fetchUrl.mock.callCount(), 0);
    assert.equal(downloaderCache.saveHead.mock.callCount(), 0);
    assert.equal(downloaderCache.saveBody.mock.callCount(), 0);

    assert.deepStrictEqual(result, {
      result: "ok",
      cachedHead: {
        url,
        status: 200,
        headers: {
          "content-type": "application/pdf",
        },
      },
      bodyPath: "some-file",
    });
  });

  // cached 404-html => return it
  void it("returns an already-cached error response", async (t) => {
    setup(t);
    givenHeadIsCached(404, "text/html");
    givenBody(false, "some-file");

    const result = await cachedOrRequest(
      url,
      urlFetcher,
      downloaderCache,
      nullLogger,
    );

    assert.deepStrictEqual(result, {
      result: "not_ok",
      cachedHead: {
        url,
        status: 404,
        headers: {
          "content-type": "text/html",
        },
      },
    });

    assert.equal(urlFetcher.fetchUrl.mock.callCount(), 0);
    assert.equal(downloaderCache.saveHead.mock.callCount(), 0);
    assert.equal(downloaderCache.saveBody.mock.callCount(), 0);
  });

  // cached 200-pdf without body => request => gives 200-pdf, save body and head, return it
  void it("it re-fetches if the success body is missing (and then gets fetch success)", async (t) => {
    setup(t);
    givenHeadIsCached(200, "application/pdf");
    givenBody(false, "some-file");
    givenResponse(200, "application/pdf", Readable.from("boop!"));

    downloaderCache.saveHead.mock.mockImplementation(() => Promise.resolve());
    downloaderCache.saveBody.mock.mockImplementation(() =>
      Promise.resolve({
        path: "some-file",
        exists: true,
        error: null,
      } as const),
    );

    const result = await cachedOrRequest(
      url,
      urlFetcher,
      downloaderCache,
      nullLogger,
    );

    assert.deepStrictEqual(result, {
      result: "ok",
      cachedHead: {
        url,
        status: 200,
        headers: {
          "content-type": "application/pdf",
        },
      },
      bodyPath: "some-file",
    });

    assert.equal(urlFetcher.fetchUrl.mock.callCount(), 1);
    assert.equal(downloaderCache.saveHead.mock.callCount(), 1);
    assert.equal(downloaderCache.saveBody.mock.callCount(), 1);
  });

  // cached 200-pdf without body => request => gives 404-html, save head, return it
  void it("it re-fetches if the success body is missing (and then gets a fetch error)", async (t) => {
    setup(t);
    givenHeadIsCached(200, "application/pdf");
    givenBody(false, "some-file");
    givenResponse(404, "text/html", Readable.from("oh no!"));

    downloaderCache.saveHead.mock.mockImplementation(() => Promise.resolve());

    const result = await cachedOrRequest(
      url,
      urlFetcher,
      downloaderCache,
      nullLogger,
    );

    assert.deepStrictEqual(
      {
        result: "not_ok",
        cachedHead: {
          url,
          status: 404,
          headers: {
            "content-type": "text/html",
          },
        },
      },
      result,
    );

    assert.equal(urlFetcher.fetchUrl.mock.callCount(), 1);
    assert.equal(downloaderCache.saveHead.mock.callCount(), 1);
    assert.equal(downloaderCache.saveBody.mock.callCount(), 0);
  });

  // not cached => request, gives 200-pdf, save body and head, return it
  void it("it fetches if the head is not cached (and then gets fetch success)", async (t) => {
    setup(t);
    givenHeadIsNotCached();
    givenBody(false, "some-file");
    givenResponse(200, "application/pdf", Readable.from("boop!"));

    downloaderCache.saveHead.mock.mockImplementation(() => Promise.resolve());
    downloaderCache.saveBody.mock.mockImplementation(() =>
      Promise.resolve({
        path: "some-file",
        exists: true,
        error: null,
      } as const),
    );

    const result = await cachedOrRequest(
      url,
      urlFetcher,
      downloaderCache,
      nullLogger,
    );

    assert.deepStrictEqual(
      {
        result: "ok",
        cachedHead: {
          url,
          status: 200,
          headers: {
            "content-type": "application/pdf",
          },
        },
        bodyPath: "some-file",
      },
      result,
    );

    assert.equal(urlFetcher.fetchUrl.mock.callCount(), 1);
    assert.equal(downloaderCache.saveHead.mock.callCount(), 1);
    assert.equal(downloaderCache.saveBody.mock.callCount(), 1);
  });

  // not cached => request, gives 404-html, save head, return it
  void it("it fetches if the head is not cached (and then gets a fetch error)", async (t) => {
    setup(t);
    givenHeadIsNotCached();
    givenBody(false, "some-file");
    givenResponse(404, "text/html", Readable.from("oh no!"));

    downloaderCache.saveHead.mock.mockImplementation(() => Promise.resolve());

    const result = await cachedOrRequest(
      url,
      urlFetcher,
      downloaderCache,
      nullLogger,
    );

    assert.deepStrictEqual(
      {
        result: "not_ok",
        cachedHead: {
          url,
          status: 404,
          headers: {
            "content-type": "text/html",
          },
        },
      },
      result,
    );

    assert.equal(urlFetcher.fetchUrl.mock.callCount(), 1);
    assert.equal(downloaderCache.saveHead.mock.callCount(), 1);
    assert.equal(downloaderCache.saveBody.mock.callCount(), 0);

    assert.deepStrictEqual(
      [
        {
          hash: urlToHash(url),
          cachedHead: result.cachedHead,
        },
      ],
      downloaderCache.saveHead.mock.calls[0]?.arguments,
    );
  });

  // error while saving the response stream to the body cache
  // (synthesise an error head; save it and return it)
  void it("it fetches if the head is not cached (and then gets fetch success, but fails to stream)", async (t) => {
    setup(t);
    givenHeadIsNotCached();
    givenBody(false, "some-file");
    givenResponse(200, "application/pdf", Readable.from("oops"));

    downloaderCache.saveHead.mock.mockImplementation(() => Promise.resolve());
    downloaderCache.saveBody.mock.mockImplementation(() =>
      Promise.resolve({
        error: new Error("it exploded while saving"),
      } as const),
    );

    const result = await cachedOrRequest(
      url,
      urlFetcher,
      downloaderCache,
      nullLogger,
    );

    assert.deepStrictEqual(
      {
        result: "not_ok",
        cachedHead: {
          url,
          status: 500,
          headers: {
            "x-streaming-rejection": ["Error", "it exploded while saving", "-"],
          },
        },
      },
      result,
    );

    assert.equal(urlFetcher.fetchUrl.mock.callCount(), 1);
    assert.equal(downloaderCache.saveHead.mock.callCount(), 1);
    assert.equal(downloaderCache.saveBody.mock.callCount(), 1);

    assert.deepStrictEqual(
      [
        {
          hash: urlToHash(url),
          cachedHead: result.cachedHead,
        },
      ],
      downloaderCache.saveHead.mock.calls[0]?.arguments,
    );
  });
});
