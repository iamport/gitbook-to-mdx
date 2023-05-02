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
  let frontmatter = "";
  let content = config.md;
  cutFrontmatter: {
    const cfr = cutFrontmatter(content);
    frontmatter = cfr.frontmatter;
    content = cfr.content;
  }
  cutTitle: {
    const ctr = cutTitle(content);
    const { emoji, title } = ctr;
    frontmatter = `emoji: ${emoji}\ntitle: ${title}\n${frontmatter}`;
    content = ctr.content;
  }
  const mdx = `---\n${frontmatter}\n---\n${content}`;
  return { path, mdx };
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
  emoji?: string;
  title: string;
  content: string;
}
function cutTitle(md: string): CutTitleResult {
  const [, t, content] = /^\s*#(.+)\r?\n((?:.|\r|\n)*)$/.exec(md)!;
  const [, emoji, title] = /^\s*(\p{Extended_Pictographic}?)\s*(.*)$/u.exec(t)!;
  if (emoji) return { emoji, title, content };
  return { title, content };
}
