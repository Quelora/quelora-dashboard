#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Directories and files to ignore
const IGNORED_ITEMS = ['node_modules', '.git', '.DS_Store', 'tree.js'];

function buildTree(dir, prefix = '', isRoot = true) {
  const files = fs.readdirSync(dir)
    .filter(file => !IGNORED_ITEMS.includes(file));
  let result = '';

  files.forEach((file, index) => {
    const fullPath = path.join(dir, file);
    const isLast = index === files.length - 1;
    const stat = fs.statSync(fullPath);

    // Skip tree.js file only in root directory
    if (isRoot && file === 'tree.js') {
      return;
    }

    result += prefix + (isLast ? '└── ' : '├── ') + file + '\n';

    if (stat.isDirectory()) {
      const newPrefix = prefix + (isLast ? '    ' : '│   ');
      result += buildTree(fullPath, newPrefix, false);
    }
  });

  return result;
}

const targetDir = process.argv[2] || '.';

if (!fs.existsSync(targetDir)) {
  console.error('Directory does not exist');
  process.exit(1);
}

const treeOutput = buildTree(targetDir, '', true);
console.log(treeOutput);

// Save output to struct.md
fs.writeFileSync('struct.md', treeOutput);
console.log('\nDirectory tree saved to struct.md');