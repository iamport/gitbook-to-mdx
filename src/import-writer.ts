export function createImportInfo(): ImportInfo {
  return {
    hint: false,
    tabAndTabs: false,
  };
}
export interface ImportInfo {
  hint: boolean;
  tabAndTabs: boolean;
}
export function writeImports(info: ImportInfo): string {
  const result: string[] = [
    `\nimport * as prose from "~/components/prose";\n`,
    `export const components = prose;\n\n`,
  ];
  if (info.hint) {
    result.push(`import Hint from "~/components/gitbook/Hint";\n`);
  }
  if (info.tabAndTabs) {
    result.push(
      `import Tabs from "~/components/gitbook/tabs/Tabs.astro";\n`,
      `import Tab from "~/components/gitbook/tabs/Tab.astro";\n`,
    );
  }
  return result.join("");
}
