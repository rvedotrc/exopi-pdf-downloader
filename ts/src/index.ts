import { parse } from "csv/sync";
import { readFile } from "node:fs/promises";

const run = async (specCSVFile: string, outputCSVFile: string, outputDirectory: string) => {
    const data = parse(await readFile(specCSVFile, "utf-8"))

};


const [specCSVFile, outputCSVFile, outputDirectory] = process.argv.slice(2);

run(specCSVFile, outputCSVFile, outputDirectory)
    .then(
        (error: unknown) => {
            console.error(error);
            process.exit(1);
        },
    )
