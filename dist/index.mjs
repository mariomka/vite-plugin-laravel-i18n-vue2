// src/config.ts
import { isAbsolute, resolve } from "path";
import { normalizePath } from "vite";
var defaultConfig = {
  langDirectory: normalizePath(`${process.cwd()}/src/Lang`)
};
var processUserConfig = (userConfig) => {
  if (userConfig?.langDirectory && isAbsolute(userConfig?.langDirectory) === false) {
    userConfig.langDirectory = normalizePath(
      resolve(userConfig.langDirectory)
    );
  }
  return userConfig;
};
function resolveConfig(userConfig) {
  return Object.assign({}, defaultConfig, processUserConfig(userConfig));
}

// src/analyse.ts
import { sep } from "path";
import { readdirSync, statSync } from "fs";
var hasPhpTranslations = (folderPath) => {
  folderPath = folderPath.replace(/[\\/]$/, "") + sep;
  try {
    const folders = readdirSync(folderPath).filter((file) => statSync(folderPath + sep + file).isDirectory()).sort();
    for (const folder of folders) {
      const lang = {};
      const files = readdirSync(folderPath + sep + folder).filter(
        (file) => /\.php$/.test(file)
      );
      if (files.length > 0) {
        return true;
      }
    }
  } catch (e) {
    console.log(e.message);
  }
  return false;
};

// src/index.ts
import FullReload from "vite-plugin-full-reload";

// src/parse.ts
import {
  readdirSync as readdirSync2,
  statSync as statSync2,
  readFileSync,
  writeFileSync,
  unlinkSync
} from "fs";
import { join } from "path";
import { Engine } from "php-parser";
var parseAll = (folderPath) => {
  folderPath = folderPath.replace(/[\\/]$/, "");
  const locales = readdirSync2(folderPath).map((file) => join(folderPath, file)).filter((path) => statSync2(path).isDirectory()).sort();
  const data = [];
  for (const locale of locales) {
    const lang = {};
    getAllFiles(locale).forEach((filePath) => {
      if (statSync2(filePath).isDirectory()) {
        return;
      }
      const key = filePath.substring(locale.length + 1).replace(/\.\w+$/, "");
      lang[key] = parse(
        readFileSync(filePath).toString()
      );
    });
    data.push({
      locale: locale.substring(folderPath.length + 1),
      translations: convertToDotsSyntax(lang)
    });
  }
  console.log(`Outputting language files in ${data.length} localisations`);
  return data.map(({ locale, translations }) => {
    const name = `php_${locale}.json`;
    const path = join(folderPath, name);
    writeFileSync(path, JSON.stringify(translations));
    return { name, path };
  });
};
var getAllFiles = (path) => {
  return readdirSync2(path).map((file) => join(path, file)).flatMap((filePath) => {
    if (statSync2(filePath).isDirectory()) {
      return getAllFiles(filePath);
    }
    return [filePath];
  }).sort();
};
var parse = (content) => {
  const arr = new Engine({}).parseCode(content, "lang").children.filter((child) => child.kind === "return")[0];
  return convertToDotsSyntax(parseItem(arr.expr));
};
var parseItem = (expr) => {
  if (expr.kind === "string") {
    return expr.value;
  }
  if (expr.kind === "array") {
    let items = expr.items.map((item) => parseItem(item));
    if (expr.items.every((item) => item.key !== null)) {
      items = items.reduce((acc, val) => Object.assign({}, acc, val), {});
    }
    return items;
  }
  if (expr.kind === "bin") {
    return parseItem(expr.left) + parseItem(expr.right);
  }
  if (expr.key) {
    return { [expr.key.value]: parseItem(expr.value) };
  }
  return parseItem(expr.value);
};
var convertToVueI18nFormat = (string) => {
  return string.replace(/:(\w+)/gi, "{$1}");
};
var convertToDotsSyntax = (list) => {
  const flatten = (items, context = "") => {
    const data = {};
    Object.entries(items).forEach(([key, value]) => {
      if (typeof value === "string") {
        value = convertToVueI18nFormat(value);
        data[context + key] = value;
        return;
      }
      Object.entries(flatten(value, context + key + ".")).forEach(
        ([itemKey, itemValue]) => {
          data[itemKey] = itemValue;
        }
      );
    });
    return data;
  };
  return flatten(list);
};

// src/index.ts
var LaravelI18n = (userConfig = {}) => {
  const config = resolveConfig(userConfig);
  const shouldProcess = hasPhpTranslations(config.langDirectory);
  return [
    {
      name: "vite-plugin-laravel-i18n",
      enforce: "post",
      handleHotUpdate(ctx) {
        if (shouldProcess && ctx.file.startsWith(config.langDirectory) && ctx.file.endsWith(".php")) {
          const parsed = parseAll(config.langDirectory);
        }
      },
      buildStart() {
        if (shouldProcess) {
          parseAll(config.langDirectory);
        }
      }
    },
    FullReload([config.langDirectory + "/**/*.php"])
  ];
};
export {
  LaravelI18n
};
