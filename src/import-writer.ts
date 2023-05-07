export function createImportInfo(): ImportInfo {
  return {
    hint: false,
    swagger: false,
    tabAndTabs: false,
  };
}
export interface ImportInfo {
  hint: boolean;
  swagger: boolean;
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
  if (info.swagger) {
    result.push(
      `import Swagger from "~/components/gitbook/swagger/Swagger.astro";\n`,
      `import SwaggerDescription from "~/components/gitbook/swagger/SwaggerDescription.astro";\n`,
      `import SwaggerParameter from "~/components/gitbook/swagger/SwaggerParameter.astro";\n`,
      `import SwaggerResponse from "~/components/gitbook/swagger/SwaggerResponse.astro";\n`,
    );
  }
  if (info.tabAndTabs) {
    result.push(
      `import Tabs from "~/components/gitbook/tabs/Tabs.astro";\n`,
      `import Tab from "~/components/gitbook/tabs/Tab.astro";\n`,
    );
  }
  return result.join("");
}
