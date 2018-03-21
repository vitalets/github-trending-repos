const fs = require('fs');
const path = require('path');
const {artifactsPath} = require('../config');
const {log} = require('./logger');

exports.save = function (filename, content) {
  if (!fs.existsSync(artifactsPath)) {
    fs.mkdirSync(artifactsPath);
  }
  const filepath = path.join(artifactsPath, filename);
  fs.writeFileSync(filepath, content, 'utf-8');
  log(`Artifact saved: ${filepath}`);
};
