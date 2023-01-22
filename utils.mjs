import fs from "node:fs";

import prettier from "prettier";
import { decode } from "@jridgewell/sourcemap-codec";

export function rmIfExists(dir) {
  if (fs.existsSync(dir)) {
    console.log(`rm -rf ${dir}`);
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

export function mkdir(dir) {
  console.log(`mkdir ${dir}`);
  fs.mkdirSync(dir, { recursive: true });
}

export function writeGeneratedFile(name, content) {
  console.log(`Writing ./generated/${name}`);

  fs.writeFileSync(
    `./generated/${name}`,
    typeof content === "string"
      ? content
      : prettier.format(JSON.stringify(content, null, 2), { parser: "json" }),
    "utf-8"
  );
}

export function writeMappings(namePrefix, mappings) {
  const decoded = decode(mappings);
  const withLineNumbers = Object.entries(decoded).reduce(
    (all, [index, mapping]) => ({ ...all, [`Line ${1 + parseInt(index)}`]: mapping }),
    {}
  );

  writeGeneratedFile(`${namePrefix}.mappings.json`, withLineNumbers);
}
