#!/usr/bin/env node
'use strict';

const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const lib = require(path.join(__dirname, 'lib', 'p07_verify.js'));

process.exit(lib.runContracts() === 0 ? 0 : 1);