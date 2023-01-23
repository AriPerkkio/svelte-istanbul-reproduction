[Examples - Working sourcemaps](#working-sourcemaps) | [Examples - Broken sourcemaps](#broken-sourcemaps)

```bash
git clone https://github.com/AriPerkkio/svelte-istanbul-reproduction.git
cd svelte-istanbul-reproduction
pnpm i
pnpm start
npx live-server@1.2.1 ./coverage
```

Remove following from `package.json` if local Svelte compiler is not present:

```diff
-  "pnpm": {
-    "overrides": {
-      "svelte": "link:../svelte"
-    }
-  }
```

## Examples

### Working sourcemaps

<img src="./docs/if-block.png" height="70px" />

Line 16 described below.

#### Decoded transpiled.js.map

```js
75 | [[26, 0, 15, 7], [29, 0, 15, 12], [33, 0, 15, 13], [39, 0, 15, 19], [44, 0, 15, 24], [45, 0, 15, 25]],
```

#### transpiled.js

```js
75                | let if_block = /*users*/ ctx[0].length === 0 && create_if_block(ctx);
transpiled.js.map |                          | |    |    |     |
[26, 0, 15, 7]    |                          ^ |    |    |     |
[29, 0, 15, 12]   |                            ^    |    |     |
[33, 0, 15, 13]   |                                 ^    |     |
[39, 0, 15, 19]   |                                      ^     |
[44, 0, 15, 24]   |                                            ^
[45, 0, 15, 25]   |                                            ^
```

#### Map to repro.svelte

```js
16                |  {#if users.length === 0}
transpiled.js.map |       |   | |    |     |
[26, 0, 15, 7]    |       ^   | |    |     |
[29, 0, 15, 12]   |           ^ |    |     |
[33, 0, 15, 13]   |             ^    |     |
[39, 0, 15, 19]   |                  ^     |
[44, 0, 15, 24]   |                        ^
[45, 0, 15, 25]   |                        ^
```

#### Decoded instrumented.js.map

```js
1963 |  [[54, 0, 15, 7], [86, 0, 15, 12], [90, 0, 15, 13, 3], [96, 0, 15, 19], [101, 0, 15, 24], [102, 0, 15, 25]]
1964 |  [[2, 0, 15, 25]]
```

#### instrumented.js

```js
1963                |  let if_block = ( /*users*/cov_208gup579f().s[24]++, (cov_208gup579f().b[4][0]++, ctx[0].length === 0) && (cov_208gup579f().b[4][1]++, create_if_block(ctx)));
instrumented.js.map |                                                      |                              |    |    |     |
[54, 0, 15, 7]      |                                                      ^                              |    |    |     |
[86, 0, 15, 12]     |                                                                                     ^    |    |     |
[90, 0, 15, 13, 3]  |                                                                                          ^    |     |
[96, 0, 15, 19]     |                                                                                               ^     |
[101, 0, 15, 24]    |                                                                                                     ^
[102, 0, 15, 25]    |                                                                                                     ^
                    |
1964                |  cov_208gup579f().s[25]++;
[2, 0, 15, 25]      |  ^
```

#### Map to repro.svelte

```js
16                  |  {#if users.length === 0}
instrumented.js.map |       ^   | |    |     |
[54, 0, 15, 7]      |           ^ |    |     |
[86, 0, 15, 12]     |             |    |     |
[90, 0, 15, 13, 3]  |             ^    |     |
[96, 0, 15, 19]     |                  ^     |
[101, 0, 15, 24]    |                        ^
[102, 0, 15, 25]    |                        ^
[2, 0, 15, 25]      |                        ^
```

#### Coverage map before remapping

```json
"branchMap": {
  "4": {
    "type": "binary-expr",
    "loc": {
      "start": { "line": 75, "column": 26 },
      "end": { "line": 75, "column": 69 }
    },
    "locations": [
      {
        "start": { "line": 75, "column": 26 },
        "end": { "line": 75, "column": 45 }
      },
      {
        "start": { "line": 75, "column": 49 },
        "end": { "line": 75, "column": 69 }
      }
    ],
    "line": 75
  }
}
```

```js
75           | let if_block = /*users*/ ctx[0].length === 0 && create_if_block(ctx);
locations[1] |                          ^^^^^^^^^^^^^^^^^^^    |||||||||||||||||||||
locations[2] |                                                 ^^^^^^^^^^^^^^^^^^^^^
```

#### Coverage map after remapping

```json
"branchMap": {
  "2": {
    "type": "binary-expr",
    "loc": {
      "start": { "line": 16, "column": 7 },
      "end": { "line": 16, "column": null }
    },
    "locations": [
      {
      "start": { "line": 16, "column": 7 },
      "end": { "line": 16, "column": 25 }
      },
      {
      "start": { "line": 16, "column": 25 },
      "end": { "line": 16, "column": null }
      }
    ]
  }
}
```

```js
16           |  {#if users.length === 0}
locations[1] |       ^^^^^^^^^^^^^^^^^^
locations[2] |                        ^// Implicit else
```

### Broken sourcemaps

<img src="./docs/each-block.png" height="55px" />

Line 13 described below.

#### Decoded transpiled.js.map

```js
```

#### transpiled.js

```js
```

#### Map to repro.svelte

#### Decoded instrumented.js.map

#### instrumented.js

#### Map to repro.svelte

#### Coverage map before remapping

#### Coverage map after remapping
