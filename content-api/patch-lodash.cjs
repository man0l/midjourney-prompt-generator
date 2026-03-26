'use strict';
const fs = require('fs');
const path = require('path');

const lodashDir = path.join(__dirname, 'node_modules', 'lodash');

// Generate ESM wrapper for main lodash
const _ = require(path.join(lodashDir, 'lodash.js'));
const lodashKeys = Object.keys(_).filter(k => k !== 'default');
const lodashWrapper = `import _lodash from './lodash.js';\nexport const {${lodashKeys.join(',')}}=_lodash;\nexport default _lodash;\n`;
fs.writeFileSync(path.join(lodashDir, 'lodash-esm.mjs'), lodashWrapper);

// Generate ESM wrapper for lodash/fp
const fp = require(path.join(lodashDir, 'fp.js'));
const fpKeys = Object.keys(fp).filter(k => typeof fp[k] === 'function');
const fpWrapper = `import _fp from './fp.js';\nexport const {${fpKeys.join(',')}}=_fp;\nexport default _fp;\n`;
fs.writeFileSync(path.join(lodashDir, 'fp-esm.mjs'), fpWrapper);

// Patch lodash/package.json exports
const pkg = JSON.parse(fs.readFileSync(path.join(lodashDir, 'package.json'), 'utf8'));
pkg.exports = {
  '.': { require: './lodash.js', default: './lodash-esm.mjs' },
  './fp': './fp-esm.mjs',
  './*': ['./*.js', './*/index.js'],
};
fs.writeFileSync(path.join(lodashDir, 'package.json'), JSON.stringify(pkg));

console.log('lodash ESM wrappers generated');
