import run from "./run.js";

const [specCSVFile, outputDirectory] = process.argv.slice(2) as [
  string,
  string,
];

run(specCSVFile, outputDirectory).catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
