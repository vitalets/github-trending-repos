const logger = require('../scripts/helpers/logger');

// disable logging
logger.log = () => {};

global.assert = require('chai').assert;
