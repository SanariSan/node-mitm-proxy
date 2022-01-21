const now = () => Date.now();

const monkeyPatchConsole = () => {
  const log = console.log;
  console.log = function (text, err) {
    const msNow = now();
    const date = new Date(msNow);

    if (err !== undefined) {
      log(err);
      return;
    }

    log(
      `[${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}:${date.getMilliseconds()}]#[${msNow}] # ${text}`,
    );
  };
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const whiteListCheck = (whiteListHostsMap, hostname) =>
  whiteListHostsMap !== undefined && whiteListHostsMap.has(hostname);

module.exports = {
  sleep,
  whiteListCheck,
  now,
  monkeyPatchConsole,
};
