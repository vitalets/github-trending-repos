const fs = require('fs-extra');
const path = require('path');
const config = require('../config');
const {log} = require('./logger');

exports.save = function (filename, content) {
  const filepath = path.join(config.artifactsPath, filename);
  fs.outputFileSync(filepath, content, 'utf8');
  log(`Artifact saved: ${filepath}`);
};
