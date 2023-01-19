import { readFileSync } from "node:fs";
import path from "node:path";

import * as svelte from "svelte/compiler";
import { JSDOM } from "jsdom";
import * as reports from "istanbul-reports";
import libCoverage from "istanbul-lib-coverage";
import { createInstrumenter } from "istanbul-lib-instrument";
import { createSourceMapStore } from "istanbul-lib-source-maps";
import { createContext } from "istanbul-lib-report";

import { mkdir, rmIfExists, writeGeneratedFile } from "./utils.mjs";

// Prepare
rmIfExists("./coverage");
rmIfExists("./generated");
mkdir("./generated");
globalThis.window = new JSDOM().window;
globalThis.document = window.document;

const filename = "repro.svelte";
const sources = readFileSync(path.resolve(filename), "utf8");

/*
 * Transpile Svelte to JavaScript
 * - https://svelte.dev/docs#compile-time-svelte-compile
 */
const { js: transpiled } = svelte.compile(sources, {
  filename,
  outputFilename: filename,
  enableSourcemap: true,
});

writeGeneratedFile("transpiled.js", transpiled.code);
writeGeneratedFile("transpiled.js.map", transpiled.map);

/*
 * Instrument JavaScript with Istanbul
 */
const instrumenter = createInstrumenter({
  esModules: true,
  compact: false,
  produceSourceMap: true,
  autoWrap: false,
  coverageVariable: "__coverage__",
  coverageGlobalScope: "globalThis",
});

const instrumented = {
  code: instrumenter.instrumentSync(transpiled.code, filename, transpiled.map),
  map: instrumenter.lastSourceMap(),
};

writeGeneratedFile("instrumented.js", instrumented.code);
writeGeneratedFile("instrumented.js.map", instrumented.map);

/*
 * Run the instrumented JavaScript to get parts of code covered
 */
const SvelteComponent = (await import("./generated/instrumented.js")).default;
new SvelteComponent({ target: document.body, props: { users: ["John Doe"] } });

/*
 * Collect coverage from instrumented JavaScript
 */
const collectedCoverage = libCoverage.createCoverageMap(
  globalThis.__coverage__
);
writeGeneratedFile("coverage.json", collectedCoverage);

/*
 * Re-map coverage map of instrumented transpiled JavaScript back to Svelte
 */
const sourceMapStore = createSourceMapStore();
const coverageMap = await sourceMapStore.transformCoverage(collectedCoverage);

/*
 * Generate reports
 */
const context = createContext({
  coverageMap,
  sourceFinder: sourceMapStore.sourceFinder,
});
["json", "html", "text"].forEach((name) =>
  reports.create(name).execute(context)
);
