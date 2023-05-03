import { createImportInfo, writeImports } from "./import-writer.ts";
import { convertPath, removeExt } from "./path-converter.ts";

export type Lang = "ko" | "en";

export interface ConvertConfig {
  lang: Lang;
  path: string;
  md: string;
}
export interface ConvertResult {
  path: string;
  mdx: string;
}
export function convert(config: ConvertConfig): ConvertResult {
  const path = convertPath(removeExt(config.path)) + ".mdx";
  const importInfo = createImportInfo();
  let frontmatter = "";
  let content = config.md;
  removeGroupSeparator: {
    content = removeGroupSeparator(content);
  }
  cutFrontmatter: {
    const result = cutFrontmatter(content);
    frontmatter = result.frontmatter;
    content = result.content;
  }
  cutTitle: {
    const result = cutTitle(content);
    const { emoji, title } = result;
    if (emoji) {
      frontmatter = `emoji: ${emoji}\ntitle: ${title}\n${frontmatter}`;
    } else {
      frontmatter = `title: ${title}\n${frontmatter}`;
    }
    content = result.content;
  }
  convertHint: {
    const result = convertHint(content);
    importInfo.hint = result.exists;
    content = result.content;
  }
  convertTabs: {
    const result = convertTabs(content);
    importInfo.tabAndTabs = result.exists;
    content = result.content;
  }
  const imports = writeImports(importInfo);
  const mdx = `---\n${frontmatter}\n---\n${imports}${content}`;
  return { path, mdx };
}

// 망할 맥OS 한글입력 버그
function removeGroupSeparator(md: string): string {
  return md.replaceAll("\x1d", "");
}

interface CutFrontmatterResult {
  frontmatter: string;
  content: string;
}
function cutFrontmatter(md: string): CutFrontmatterResult {
  const [, frontmatter, content] =
    /^---\r?\n((?:.|\r|\n)+?)\r?\n---\r?\n((?:.|\r|\n)*)$/.exec(md)!;
  return { frontmatter, content };
}

interface CutTitleResult {
  emoji: string;
  title: string;
  content: string;
}
function cutTitle(md: string): CutTitleResult {
  const [, t, content] = /^\s*#(.+)\r?\n((?:.|\r|\n)*)$/.exec(md)!;
  const [, emoji, title] = /^\s*(\p{Extended_Pictographic}?)\s*(.*)$/u.exec(t)!;
  return { emoji, title, content };
}

interface ConvertHintResult {
  exists: boolean;
  content: string;
}
function convertHint(md: string): ConvertHintResult {
  let exists = false;
  const content = md
    .replaceAll(
      /\{% hint style="(.*?)" %\}/g,
      (_, style) => {
        exists = true;
        return `<Hint style="${style}">`;
      },
    ).replaceAll("{% endhint %}", "\n</Hint>");
  return { content, exists };
}

interface ConvertTabsResult {
  exists: boolean;
  content: string;
}
function convertTabs(md: string): ConvertTabsResult {
  let exists = false;
  const content = md
    .replaceAll("{% tabs %}", "<Tabs>")
    .replaceAll("{% endtabs %}", "</Tabs>")
    .replaceAll(
      /\{% tab title="(.*?)" %\}/g,
      (_, title) => {
        exists = true;
        return `<Tab title="${title}">`;
      },
    ).replaceAll("{% endtab %}", "\n</Tab>");
  return { content, exists };
}
