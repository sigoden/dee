import fs from "fs";
import path from "path";

interface ModuleMap {
  [k: string]: any;
}

export function mergedRequireDir(dir: string): ModuleMap {
  const names = fs.readdirSync(dir);
  const result = {};
  for (const name of names) {
    const fp = path.join(dir, name);
    const stat = fs.statSync(fp);
    if (stat.isDirectory()) {
      if (result[name]) {
        throw new Error(`fail to require dir ${fp}, properity conflict`);
      }
      result[name] = mergedRequireDir(fp);
    } else if (stat.isFile()) {
      const fm = require(fp);
      Object.keys(fm).forEach(k => {
        if (result[k]) {
          throw new Error(`fail to merge mdoule ${fp}, properity conflict`);
        }
        result[k] = fm[k];
      });
    }
  }
  return result;
}

export function requireSafely(modulePath: string): any {
  let result = {};
  try {
    result = require(modulePath);
  } catch (err) {}
  return result;
}

export function camelCaseToSnakeCase(name: string): string {
  return String(name)
    .split("")
    .map(c => {
      const code = c.charCodeAt(0);
      if (code >= 65 && code <= 90) {
        return "_" + c.toLocaleLowerCase();
      }
      return c;
    })
    .join("")
    .replace(/^_/, "");
}
