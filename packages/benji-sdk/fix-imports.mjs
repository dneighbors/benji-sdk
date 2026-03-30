import { readdir, readFile, writeFile, stat } from 'fs/promises';
import { join, dirname, resolve } from 'path';

async function isDirectory(basePath, importPath) {
  // Resolve the import relative to the file's directory
  const resolvedPath = resolve(dirname(basePath), importPath);
  try {
    const stats = await stat(resolvedPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

async function fixImportsInFile(filePath) {
  let content = await readFile(filePath, 'utf-8');

  // Find all relative imports that don't have .js extension
  const importRegex = /(from\s+['"])(\.\.?\/[^'"]+)(['"])/g;
  const matches = [...content.matchAll(importRegex)];

  let newContent = content;

  for (const match of matches) {
    const [fullMatch, prefix, importPath, suffix] = match;

    // Skip if already has a file extension
    if (/\.[a-z0-9]+$/i.test(importPath)) continue;

    // Check if it's a directory import
    const isDir = await isDirectory(filePath, importPath);

    let fixedPath;
    if (isDir) {
      fixedPath = `${importPath}/index.js`;
    } else {
      fixedPath = `${importPath}.js`;
    }

    newContent = newContent.replace(fullMatch, `${prefix}${fixedPath}${suffix}`);
  }

  if (content !== newContent) {
    await writeFile(filePath, newContent);
    console.log(`Fixed: ${filePath}`);
    return true;
  }
  return false;
}

async function walkDir(dir) {
  const files = await readdir(dir, { withFileTypes: true });
  const tsFiles = [];

  for (const file of files) {
    const fullPath = join(dir, file.name);
    if (file.isDirectory()) {
      tsFiles.push(...await walkDir(fullPath));
    } else if (file.name.endsWith('.ts')) {
      tsFiles.push(fullPath);
    }
  }

  return tsFiles;
}

const srcDir = './src';
const files = await walkDir(srcDir);
let fixedCount = 0;

for (const file of files) {
  if (await fixImportsInFile(file)) {
    fixedCount++;
  }
}

console.log(`\nFixed ${fixedCount} files`);
