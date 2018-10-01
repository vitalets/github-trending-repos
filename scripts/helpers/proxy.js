/**
 * Global proxy
 */

const axios = require('axios');
const globalTunnel = require('global-tunnel-ng');
const {log} = require('./logger');

let proxyInfo = null;

exports.enable = async function () {
  if (!proxyInfo) {
    proxyInfo = await getProxy();
    log(`Proxy info:`, JSON.stringify(proxyInfo, false, 2));
  }
  globalTunnel.initialize({
    host: proxyInfo.ip,
    port: proxyInfo.port,
  });
  log('Proxy enabled.');
};

exports.disable = function () {
  globalTunnel.end();
  log('Proxy disabled.');
};

// see: https://getproxylist.com/#how-it-works
async function getProxy() {
  const url = 'https://api.getproxylist.com/proxy?protocol[]=http&allowsHttps=1&minDownloadSpeed=300&minUptime=50';
  const response = await axios.get(url);
  return response.data;
}
