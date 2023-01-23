import fs from "node:fs";
import { EOL } from "node:os";

import prettier from "prettier";
import { decode } from "@jridgewell/sourcemap-codec";
import { codeFrameColumns } from "@babel/code-frame";

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
  const withLineNumbers = Object.entries(decoded).reduce((all, [index, mapping]) => {
    if (mapping.length === 0) return all;

    return { ...all, [`Line ${1 + parseInt(index)}`]: mapping };
  }, {});

  writeGeneratedFile(`${namePrefix}.mappings.json`, withLineNumbers);
}

export function writeRemapping(namePrefix, generated, sourcemap) {
  const decodedMappings = decode(sourcemap.mappings);
  const [sources] = sourcemap.sourcesContent;
  const markdownRows = [];

  for (const [generatedRowIndex, mappings] of decodedMappings.entries()) {
    const mappingPairs = mappings.reduce((all, current, index) => {
      const pairIndex = Math.floor(index / 2);
      const entry = all[pairIndex] || [];
      entry.push(current);
      all[pairIndex] = entry;

      return all;
    }, []);

    for (const [start, end] of mappingPairs) {
      const generatedPosition = {
        start: { line: 1 + generatedRowIndex, column: 1 + start[0] },
        end: { line: 1 + generatedRowIndex, column: 1 + end[0] },
      };
      const sourcePosition = {
        start: { line: 1 + start[2], column: 1 + start[3] },
        end: { line: 1 + end[2], column: 1 + end[3] },
      };

      const generatedCodeFrame = codeFrameColumns(generated, generatedPosition);
      const sourceCodeFrame = codeFrameColumns(sources, sourcePosition);

      markdownRows.push(`
Source:
\`\`\`js
${sourceCodeFrame}
\`\`\`

Generated:
\`\`\`js
${generatedCodeFrame}
\`\`\`
`);
    }
  }

  const markdown = markdownRows.map((row) => row.trim()).join(`${EOL}${EOL}___${EOL}${EOL}`);

  writeGeneratedFile(`${namePrefix}.remapped.md`, markdown);
}
