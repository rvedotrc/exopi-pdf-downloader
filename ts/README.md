# PDF Downloader

## Building

Preferred build method (using `asdf`):

```shell
asdf install
pnpm install
pnpm build
```

If you're not using `asdf` then this will probably also be fine:

- install a modern version of `node`
- `npm install`
- `npm run build`

## Running

1. Export the Excel file listing the URLs to fetch, to a CSV file. The first row of that file must include the column headers: `id`, `url`, `alt_url`.
2. Choose an output directory, e.g. `./var`
3. Run it:

```shell
pnpm start input.csv ./var
```

(or use `npm` instead of `pnpm`).

The results are cached under `./var/hash`. A detailed result set is written to `./var/all-results.json`.

TODO, write the files index by item ID.

## Further reading

- [Design](./DESIGN.md)
