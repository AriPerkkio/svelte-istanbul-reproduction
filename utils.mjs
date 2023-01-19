import fs from "node:fs";

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
    typeof content === "string" ? content : JSON.stringify(content, null, 2),
    "utf-8"
  );
}
