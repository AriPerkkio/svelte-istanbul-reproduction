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
