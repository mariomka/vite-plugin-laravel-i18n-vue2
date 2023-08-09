var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  LaravelI18n: () => LaravelI18n
});
module.exports = __toCommonJS(src_exports);

// src/config.ts
var import_node_path = require("path");
var import_vite = require("vite");
var defaultConfig = {
  langDirectory: (0, import_vite.normalizePath)(`${process.cwd()}/src/Lang`)
};
var processUserConfig = (userConfig) => {
  if (userConfig?.langDirectory && (0, import_node_path.isAbsolute)(userConfig?.langDirectory) === false) {
    userConfig.langDirectory = (0, import_vite.normalizePath)(
      (0, import_node_path.resolve)(userConfig.langDirectory)
    );
  }
  return userConfig;
};
function resolveConfig(userConfig) {
  return Object.assign({}, defaultConfig, processUserConfig(userConfig));
}

// src/analyse.ts
var import_node_path2 = require("path");
var import_node_fs = require("fs");
var hasPhpTranslations = (folderPath) => {
  folderPath = folderPath.replace(/[\\/]$/, "") + import_node_path2.sep;
  try {
    const folders = (0, import_node_fs.readdirSync)(folderPath).filter((file) => (0, import_node_fs.statSync)(folderPath + import_node_path2.sep + file).isDirectory()).sort();
    for (const folder of folders) {
      const lang = {};
      const files = (0, import_node_fs.readdirSync)(folderPath + import_node_path2.sep + folder).filter(
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
var import_vite_plugin_full_reload = __toESM(require("vite-plugin-full-reload"));

// src/parse.ts
var import_node_fs2 = require("fs");
var import_node_path3 = require("path");
var import_php_parser = require("php-parser");
var parseAll = (folderPath) => {
  folderPath = folderPath.replace(/[\\/]$/, "");
  const locales = (0, import_node_fs2.readdirSync)(folderPath).map((file) => (0, import_node_path3.join)(folderPath, file)).filter((path) => (0, import_node_fs2.statSync)(path).isDirectory()).sort();
  const data = [];
  for (const locale of locales) {
    const lang = {};
    getAllFiles(locale).forEach((filePath) => {
      if ((0, import_node_fs2.statSync)(filePath).isDirectory()) {
        return;
      }
      const key = filePath.substring(locale.length + 1).replace(/\.\w+$/, "");
      lang[key] = parse(
        (0, import_node_fs2.readFileSync)(filePath).toString()
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
    const path = (0, import_node_path3.join)(folderPath, name);
    (0, import_node_fs2.writeFileSync)(path, JSON.stringify(translations));
    return { name, path };
  });
};
var getAllFiles = (path) => {
  return (0, import_node_fs2.readdirSync)(path).map((file) => (0, import_node_path3.join)(path, file)).flatMap((filePath) => {
    if ((0, import_node_fs2.statSync)(filePath).isDirectory()) {
      return getAllFiles(filePath);
    }
    return [filePath];
  }).sort();
};
var parse = (content) => {
  const arr = new import_php_parser.Engine({}).parseCode(content, "lang").children.filter((child) => child.kind === "return")[0];
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
    (0, import_vite_plugin_full_reload.default)([config.langDirectory + "/**/*.php"])
  ];
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LaravelI18n
});
