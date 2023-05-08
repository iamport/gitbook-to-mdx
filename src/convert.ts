import { stringify } from "https://deno.land/std@0.185.0/yaml/mod.ts";

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
  const pathWithoutExt = convertPath(removeExt(config.path));
  if (pathWithoutExt === "summary") {
    return { path: "./_nav.yaml", mdx: convertSummary(config) };
  }
  const path = pathWithoutExt + ".mdx";
  const importInfo = createImportInfo();
  let frontmatter = "";
  let content = config.md;
  removeSeparators: {
    content = removeSeparators(content);
  }
  sanitizeSelfClosingImg: {
    content = sanitizeSelfClosingImg(content);
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
  convertCode: {
    content = convertCode(content);
  }
  convertCodepen: {
    const result = convertCodepen(content);
    importInfo.codepen = result.exists;
    content = result.content;
  }
  convertContentRef: {
    const result = convertContentRef(content, config.lang);
    importInfo.contentRef = result.exists;
    content = result.content;
  }
  convertDetails: {
    const result = convertDetails(content);
    importInfo.details = result.exists;
    content = result.content;
  }
  convertHint: {
    const result = convertHint(content);
    importInfo.hint = result.exists;
    content = result.content;
  }
  convertSwagger: {
    const result = convertSwagger(content);
    importInfo.swagger = result.exists;
    content = result.content;
  }
  convertTabs: {
    const result = convertTabs(content);
    importInfo.tabAndTabs = result.exists;
    content = result.content;
  }
  convertYoutube: {
    const result = convertYoutube(content);
    importInfo.youtube = result.exists;
    content = result.content;
  }
  const imports = writeImports(importInfo);
  const mdx = `---\n${frontmatter}\n---\n${imports}${content}`;
  return { path, mdx };
}

function convertSummary(config: ConvertConfig): string {
  let content = config.md;
  content = removeSeparators(content);
  content = content.replace(/^# .+(?:\r|\n)*/, "***\n\n");
  const titleAndLists = (() => {
    const result: string[] = [];
    const titleBuffer: string[] = [];
    for (const i of content.split(/\r?\n(?:\r?\n)+/).filter(Boolean)) {
      const isTitle = i.startsWith("#") || i.startsWith("***");
      if (isTitle) {
        titleBuffer.push(
          (i === "***" ? "" : i.replace(/^#*\s*/, ""))
            .replace(/<a.*?>.*?<\/a>/, "")
            .trim(),
        );
      } else {
        if (titleBuffer.length > 0) {
          result.push(titleBuffer.pop()!);
          titleBuffer.length = 0;
        }
        result.push(i);
      }
    }
    return result;
  })();
  interface Group {
    label: string;
    items: any[];
  }
  const groups: Group[] = [];
  for (const [title, list] of chunk(titleAndLists, 2)) {
    const group: Group = {
      label: title,
      items: [],
    };
    const itemsStack: { indent: number; items: any[] }[] = [
      { indent: -1, items: group.items },
    ];
    const getParent = () => itemsStack[itemsStack.length - 1];
    for (const line of list.split(/\r?\n/)) {
      const item = {
        slug: `/${config.lang}/${
          convertPath(line.replace(
            /^\s*\*\s*\[.*?\]\((?:\<(.*?)(?:\.md)?\>|(.*?)(?:\.md)?)\)/,
            "$1$2",
          ))
        }`,
        items: [],
      };
      const currentIndentLevel = line.replace(/^(\s*).*$/, "$1").length;
      while (getParent().indent >= currentIndentLevel) itemsStack.pop();
      getParent().items.push(item);
      itemsStack.push({ indent: currentIndentLevel, items: item.items });
    }
    const itemsQueue = [group.items];
    let currItems: any[];
    while (currItems = itemsQueue.shift()!) {
      for (let i = 0; i < currItems.length; ++i) {
        const item = currItems[i];
        if (item.items.length > 0) {
          itemsQueue.push(item.items);
        } else {
          currItems[i] = item.slug;
        }
      }
    }
    groups.push(group);
  }
  const yaml: any = [];
  for (const group of groups) {
    if (group.label) {
      yaml.push(group);
      continue;
    }
    if (yaml.length) yaml.push("===");
    yaml.push(...group.items);
  }
  return stringify(yaml);
}

// 망할 맥OS 한글입력 버그
function removeSeparators(md: string): string {
  return md.replaceAll("\x1d", "").replaceAll("\b", "");
}

function sanitizeSelfClosingImg(md: string): string {
  return md.replaceAll(/<img(.*?[^/])>/g, "<img$1/>");
}

interface CutFrontmatterResult {
  frontmatter: string;
  content: string;
}
function cutFrontmatter(md: string): CutFrontmatterResult {
  const r = /^---\r?\n((?:.|\r|\n)+?)\r?\n---\r?\n((?:.|\r|\n)*)$/.exec(md);
  if (!r) return { frontmatter: "description: ''", content: md };
  const [, frontmatter, content] = r;
  return { frontmatter, content };
}

interface CutTitleResult {
  emoji: string;
  title: string;
  content: string;
}
function cutTitle(md: string): CutTitleResult {
  const [, t, content] = /^\s*#(.+)\r?\n?((?:.|\r|\n)*)$/.exec(md)!;
  const [, emoji, title] = /^\s*(\p{Extended_Pictographic}?)\s*(.*)$/u.exec(t)!;
  return { emoji, title, content };
}

interface ResultWithExistence {
  exists: boolean;
  content: string;
}

function convertCode(md: string): string {
  return md
    .replaceAll(
      /\{% code(?: title="(.*?)")?( lineNumbers="true")? %\}\s+```(.*)/g,
      (_, title, lineNumbers, lang) => {
        if (title && lineNumbers) {
          return "```" + `${lang} title="${title}" showLineNumbers`;
        }
        if (title) return "```" + `${lang} title="${title}"`;
        if (lineNumbers) return "```" + `${lang} showLineNumbers`;
        return "```" + lang;
      },
    ).replaceAll("{% endcode %}", "");
}

function convertCodepen(md: string): ResultWithExistence {
  let exists = false;
  const content = md
    .replaceAll(
      /\{% embed url="https:\/\/codepen.io\/(.*?)\/pen\/(.*?)" %\}((?:.|\r|\n)*?)\{% endembed %\}/g,
      (_, user, slug, caption) => {
        exists = true;
        return `<Codepen user="${user}" slug="${slug}" caption="${caption.trim()}" />`;
      },
    )
    .replaceAll(
      /\{% embed url="https:\/\/codepen.io\/(.*?)\/pen\/(.*?)" %\}/g,
      (_, user, slug) => {
        exists = true;
        return `<Codepen user="${user}" slug="${slug}" />`;
      },
    );
  return { content, exists };
}

function convertDetails(md: string): ResultWithExistence {
  let exists = false;
  const content = md
    .replaceAll(
      /<details>\s*<summary>((?:.|\r|\n)*?)<\/summary>((?:.|\r|\n)*?)<\/details>/g,
      (_, summary, content) => {
        exists = true;
        return `<Details>\n<p slot="summary">${summary}</p>${content}</Details>`;
      },
    );
  return { content, exists };
}

function convertContentRef(md: string, lang: string): ResultWithExistence {
  let exists = false;
  const content = md
    .replaceAll(
      /\{% content-ref url="(.*?)(?:\.md)?" %\}((?:.|\r|\n)*?)\{% endcontent-ref %\}/g,
      (_, url: string) => {
        exists = true;
        if (url.endsWith("/")) url = url + "readme";
        return `<ContentRef slug="/${lang}/${convertPath(url)}" />`;
      },
    );
  return { content, exists };
}

function convertHint(md: string): ResultWithExistence {
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

function convertSwagger(md: string): ResultWithExistence {
  let exists = false;
  const content = md
    .replaceAll(
      /\{% swagger (.*?) %\}((.|\r|\n)*?)\{% endswagger %\}/g,
      (_, props: string, content: string) => {
        exists = true;
        return `<Swagger ${props}>${
          content
            .replaceAll("{% swagger-description %}", "<SwaggerDescription>")
            .replace(
              /\{% swagger-parameter (?:.|\r|\n)+ endswagger-parameter %\}/,
              (content) => {
                interface SwaggerParameter {
                  props: string;
                  content: string;
                }
                const groups: { [type: string]: SwaggerParameter[] } = {};
                for (
                  const [_, a, b, c] of content.matchAll(
                    /\{% swagger-parameter in="([^"]*?)" (.*?) %}((?:.|\r|\n)+?)\{% endswagger-parameter %\}/g,
                  )
                ) (groups[a] ??= []).push({ props: b, content: c });
                return `### Parameters\n\n${
                  Object.entries(groups).map(
                    ([k, group]) =>
                      `#### ${k[0].toUpperCase()}${k.slice(1)}\n\n${
                        group.map(({ props, content }) =>
                          `<SwaggerParameter ${props}>${content}\n</SwaggerParameter>\n`
                        ).join("")
                      }`,
                  ).join("")
                }`;
              },
            )
            .replace(
              /\{% swagger-response (?:.|\r|\n)+ endswagger-response %\}/,
              (content) =>
                `### Responses\n\n${
                  content.replaceAll(
                    /\{% swagger-response (.*?) %\}((.|\r|\n)*?)\{% endswagger-response %\}/g,
                    (_, props, content) =>
                      `<SwaggerResponse ${props}>${content}\n</SwaggerResponse>`,
                  )
                }`,
            )
            .replaceAll(
              "{% endswagger-description %}",
              "\n</SwaggerDescription>",
            )
        }\n</Swagger>`;
      },
    );
  return { content, exists };
}

function convertTabs(md: string): ResultWithExistence {
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

function convertYoutube(md: string): ResultWithExistence {
  let exists = false;
  const content = md
    .replaceAll(
      /\{% embed url="https:\/\/youtu.be\/(.*?)" %\}((?:.|\r|\n)*?)\{% endembed %\}/g,
      (_, videoId, caption) => {
        exists = true;
        return `<Youtube videoId="${videoId}" caption="${caption.trim()}" />`;
      },
    );
  return { content, exists };
}

function chunk<T>(array: T[], num: number): T[][] {
  return array.reduce((subarr, item, i) => {
    (subarr[(i / num) | 0] ??= []).push(item);
    return subarr;
  }, [] as T[][]);
}
