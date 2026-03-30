# Design

## Internal cache

There is a cache, persisted to disk, which is keyed by URL. This allows for efficient handling when the same URL appears multiple times in the input. Heads (HTTP status & headers) and bodies (PDF files) are cached separately.

The cache is consulted before making an HTTP request (since it might be unnecessary), and the cache is updated once the request is settled.

Errors other than HTTP response errors (e.g. invalid URL, or timeout while reading the response content) are synthesised into HTTP response errors.

An HTTP response is `ok` if it has status 200, and Content-Type "application/pdf". Otherwise, it is `not_ok`. For an `ok` response, we cache the HTTP status, the HTTP response headers, and the response content (i.e. the PDF file). For a `not_ok` response, we cache the HTTP status and the HTTP response headers, but not the response content.

Both `ok` and `not_ok` outcomes are cached indefinitely. This has the advantage of faster execution (in particular, so that we don't hit the same errors again and again on every re-run), but the disadvantage that a possibly-transient error is, by default, never retried.

## Input and output

We don't actually read or write Excel files. We read CSV, and we write JSON.

## The output directory

TODO
