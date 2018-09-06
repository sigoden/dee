import { requireDir, requireSafely } from "../src";
import * as path from "path";

describe("requireDir", () => {
  test("should load modules from folder and merge", () => {
    const obj = requireDir(path.resolve(__dirname, "fixtures/simple"));
    expect(Object.keys(obj)).toEqual(["A1", "A2", "B1"]);
  });
});

describe("requireSafely", () => {
  test("should return {} when fail to load module", () => {
    const obj = requireSafely("./fixtures/mod");
    expect(obj).toEqual({});
  });
});
