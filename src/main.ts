import { emptyDir } from "https://deno.land/std@0.185.0/fs/empty_dir.ts";
import { ensureDir } from "https://deno.land/std@0.185.0/fs/ensure_dir.ts";
import { walk } from "https://deno.land/std@0.185.0/fs/walk.ts";
import * as path from "https://deno.land/std@0.185.0/path/mod.ts";

import { convert, Lang } from "./convert.ts";

await emptyDir("./dist");
await job("ko", "./gitbook", 30);
// await job("en", "./gitbook-eng", 10);

async function job(lang: Lang, dir: string, n: number = Infinity) {
  const mds = walk(dir, {
    exts: ["md"],
    skip: [/\.gitbook/],
    includeDirs: false,
  });
  for await (const item of take(n, mds)) {
    const md = await Deno.readTextFile(item.path);
    const inPath = path.relative(dir, item.path);
    const convertResult = convert({ path: inPath, lang, md });
    const outPath = path.resolve("./dist", lang, convertResult.path);
    await ensureDir(path.dirname(outPath));
    await Deno.writeTextFile(outPath, convertResult.mdx);
  }
}

async function* take<T>(n: number, items: AsyncIterable<T>): AsyncGenerator<T> {
  if (n < 1) return;
  for await (const item of items) {
    yield item;
    if (--n < 1) break;
  }
}
