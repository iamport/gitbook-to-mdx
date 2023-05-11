import { walk } from "https://deno.land/std@0.185.0/fs/walk.ts";

const mds = walk("./gitbook", {
  exts: ["md"],
  skip: [/\.gitbook/],
  includeDirs: false,
});
for await (const item of mds) {
  if (item.path.includes("SUMMARY.md")) continue;
  console.log(item.path);
  const md = await Deno.readTextFile(item.path);
  await Deno.writeTextFile(item.path, addDeprecationNote(md));
}

function addDeprecationNote(md: string): string {
  return md.replace(
    /^(---(?:.|\r|\n)*---\s*# (?:.*)\r?\n)/,
    `$1
{% hint style="warning" %}
**Deprecated**

이 문서는 더 이상 관리되지 않습니다.

[PortOne 개발자센터](https://developers.portone.io/)를 이용해주세요.
{% endhint %}
`,
  );
}
