import { readFileSync } from "node:fs";
import path from "node:path";

import * as svelte from "svelte/compiler";
import * as server from "svelte/internal/server";
import { JSDOM } from "jsdom";
import * as reports from "istanbul-reports";
import libCoverage from "istanbul-lib-coverage";
import { createInstrumenter } from "istanbul-lib-instrument";
import { createSourceMapStore } from "istanbul-lib-source-maps";
import { createContext } from "istanbul-lib-report";

import {
  mkdir,
  rmIfExists,
  writeCoverageRemappings,
  writeGeneratedFile,
  writeMappings,
  writeRemapping,
} from "./utils.mjs";

// Prepare
rmIfExists("./coverage");
rmIfExists("./generated");
mkdir("./generated");
globalThis.window = new JSDOM().window;
globalThis.document = window.document;
globalThis.requestAnimationFrame = window.requestAnimationFrame;
globalThis.Node = window.Node;
globalThis.Element = window.Element;
globalThis.Text = window.Text;

const filename = "repro.svelte";
const sources = readFileSync(path.resolve(filename), "utf8");
console.log("");

/*
 * Transpile Svelte to JavaScript
 * - https://svelte.dev/docs#compile-time-svelte-compile
 */
const { js: transpiled } = svelte.compile(sources, {
  filename,
  outputFilename: filename,
  generate: "server",
  enableSourcemap: true,
});

// Replace Svelte's tabs with spaces for easier debugging. Should not affect results anyhow.
transpiled.code = transpiled.code.replaceAll("\t", " ");

writeGeneratedFile("transpiled.js", transpiled.code);
writeGeneratedFile("transpiled.js.map", transpiled.map);
writeMappings("transpiled", transpiled.map.mappings);
writeRemapping("transpiled", transpiled.code, transpiled.map);
console.log("");

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
writeMappings("instrumented", instrumented.map.mappings);
writeRemapping("instrumented", instrumented.code, instrumented.map);
console.log("");

/*
 * Run the instrumented JavaScript to get parts of code covered
 */
console.log("Running ./generated/instrumented.js");
const SvelteComponent = (await import("./generated/instrumented.js")).default;
server.render(SvelteComponent, { props: { users: ["John Doe"] } });
console.log("");

/*
 * Collect coverage from instrumented JavaScript
 */
const collectedCoverage = libCoverage.createCoverageMap(globalThis.__coverage__);
writeGeneratedFile("coverage-pre.json", collectedCoverage);
writeCoverageRemappings("transpiled", collectedCoverage.fileCoverageFor(filename), transpiled.code);

/*
 * Re-map coverage map of instrumented transpiled JavaScript back to Svelte
 */
const sourceMapStore = createSourceMapStore();
const coverageMap = await sourceMapStore.transformCoverage(collectedCoverage);
writeGeneratedFile("coverage-final.json", coverageMap);
writeCoverageRemappings("sources", coverageMap.fileCoverageFor(path.resolve(filename)), sources);

/*
 * Generate reports
 */
const context = createContext({
  coverageMap,
  sourceFinder: sourceMapStore.sourceFinder,
});
["json", "html", "text"].forEach((name) => reports.create(name).execute(context));
