import * as m from "../src/engine.js";

if (m as unknown) {
}

// import assert from "node:assert";
// import { describe, it, mock, type TestContext } from "node:test";

// import type { DownloaderCache } from "../src/downloaderCache.js";
// import type { UrlResult } from "../src/engine.js";
// import type { Item } from "../src/items.js";
// import type { URLFetcher } from "../src/urlFetcher.js";

// const urlFetcher = "fake-fetcher" as unknown as URLFetcher;
// const cache = "fake-cache" as unknown as DownloaderCache;
// const logger = "fake-logger" as unknown as Console;

// let xfn = (_url: string): Promise<UrlResult> =>
//   Promise.reject(new Error("no implementation"));

// mock.module("../src/cachedOrRequest.js", {
//   defaultExport: async (
//     url: string,
//     fetcherArg: URLFetcher,
//     cacheArg: DownloaderCache,
//     loggerArg: Console,
//   ) => {
//     assert.equal(fetcherArg, urlFetcher);
//     assert.equal(cacheArg, cache);
//     assert.equal(loggerArg, logger);
//     return await xfn(url);
//   },
// });

// const m = await import("../src/engine.js");

// void describe("engine", () => {
//   const setup = (t: TestContext, tfn: (url: string) => Promise<UrlResult>) => {
//     xfn = tfn;
//     const engine = m.createEngine(urlFetcher, cache, logger);

//     return { engine };
//   };

//   // void it("handles a simple item", async (t) => {
//   //   const u1Result: UrlResult = {
//   //     result: "not_ok",
//   //     cachedHead: {
//   //       url: "u1",
//   //       status: 500,
//   //       headers: {},
//   //     },
//   //   };

//   //   const fn = async (url: string): Promise<UrlResult> => {
//   //     assert.equal(url, "u1");
//   //     return await Promise.resolve(u1Result);
//   //   };

//   //   const s = await setup(t, fn);

//   //   const item: Item = {
//   //     id: "123",
//   //     url: "u1",
//   //     altUrl: null,
//   //   };

//   //   const actual = await s.engine.tryItem(item);

//   //   assert.deepStrictEqual(actual, {
//   //     item,
//   //     result1: u1Result,
//   //     result2: null,
//   //   });
//   // });

//   void it("ignores the fallback url on success", async (t) => {
//     const u1Result: UrlResult = {
//       result: "ok",
//       cachedHead: {
//         url: "u1",
//         status: 200,
//         headers: {},
//       },
//       bodyPath: "",
//     };

//     const fn = t.mock.fn(async () => Promise.resolve(u1Result));
//     const s = setup(t, fn);

//     const item: Item = {
//       id: "123",
//       url: "u1",
//       altUrl: "u2",
//     };

//     const actual = await s.engine.tryItem(item);

//     assert.equal(1, fn.mock.callCount());
//     assert.deepStrictEqual(["u1"], fn.mock.calls[0]?.arguments);
//     assert.deepStrictEqual(actual, {
//       item,
//       result1: u1Result,
//       result2: null,
//     });
//   });

//   void it("uses the fallback url on failure", async (t) => {
//     const u1Result: UrlResult = {
//       result: "ok",
//       cachedHead: {
//         url: "u1",
//         status: 500,
//         headers: {},
//       },
//       bodyPath: "",
//     };
//     const u2Result: UrlResult = {
//       result: "ok",
//       cachedHead: {
//         url: "u2",
//         status: 200,
//         headers: {},
//       },
//       bodyPath: "",
//     };

//     const fn = t.mock.fn(async (url: string) => {
//       console.dir({ url });
//       return Promise.resolve(
//         // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
//         {
//           u1: u1Result,
//           u2: u2Result,
//         }[url]!,
//       );
//     });
//     const s = setup(t, fn);

//     const item: Item = {
//       id: "123",
//       url: "u1",
//       altUrl: "u2",
//     };

//     const actual = await s.engine.tryItem(item);

//     assert.equal(2, fn.mock.callCount());
//     assert.deepStrictEqual(["u1"], fn.mock.calls[0]?.arguments);
//     assert.deepStrictEqual(["u2"], fn.mock.calls[1]?.arguments);
//     assert.deepStrictEqual(actual, {
//       item,
//       result1: u1Result,
//       result2: u2Result,
//     });
//   });
// });
