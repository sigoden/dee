const fs = require("fs");
const path = require("path");

const PACKAGES_DIR = path.resolve(__dirname, "../packages");

// Get absolute paths of all directories under packages
function getPackages() {
  let pkgNames = fs.readdirSync(PACKAGES_DIR);
  return resolvePackages(pkgNames);
}

// Get absolute paths of package by pkgNames
function resolvePackages(pkgNames) {
  return pkgNames
    .map(name => path.resolve(PACKAGES_DIR, name))
    .filter(isDirectory);
}

function isDirectory(file) {
  return fs.lstatSync(path.resolve(file)).isDirectory();
}

exports.getPackages = getPackages;
exports.resolvePackages = resolvePackages;
