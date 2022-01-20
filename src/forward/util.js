const sleep = (ms) => new Promise((resolve, reject) => setTimeout(resolve, ms));

const whiteListCheck = (whiteListHostsMap, hostname) =>
  whiteListHostsMap !== undefined && whiteListHostsMap.has(hostname);

const now = () => Date.now() + 3600000 * 3;

module.exports = {
  sleep,
  whiteListCheck,
  now,
};
