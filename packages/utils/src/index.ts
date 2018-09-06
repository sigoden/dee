import * as fs from "fs";
import * as path from "path";

interface ModuleMap {
  [k: string]: any;
}

export function requireDir(moduleDir: string): ModuleMap {
  const names = fs.readdirSync(moduleDir);
  const result = {};
  for (const name of names) {
    const fp = path.join(moduleDir, name);
    const stat = fs.statSync(fp);
    if (stat.isDirectory()) {
      if (result[name]) {
        throw new Error(
          `fail to require module directory ${fp}, properity conflict`
        );
      }
      result[name] = requireDir(fp);
    } else if (stat.isFile()) {
      const fm = require(fp);
      Object.keys(fm).forEach(k => {
        if (result[k]) {
          throw new Error(
            `fail to require mdoule file ${fp}, properity conflict`
          );
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
