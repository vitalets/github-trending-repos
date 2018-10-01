/**
 * Global proxy
 */

const globalTunnel = require('global-tunnel-ng');
const {log} = require('./logger');

const proxyInfo = {
  ip: process.env.HTTP_PROXY_HOST,
  port: process.env.HTTP_PROXY_PORT,
};

exports.enable = async function () {
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
// async function getProxy() {
//   const url = 'https://api.getproxylist.com/proxy?protocol[]=http&allowsHttps=1&minDownloadSpeed=300&minUptime=50';
//   const response = await axios.get(url);
//   return response.data;
// }
