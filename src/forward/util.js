const now = () => Date.now();

const makeTimeHR = (ms) => {
  const date = new Date(ms);
  return `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}:${date.getMilliseconds()}`;
};

const monkeyPatchConsole = ({ disableLogging }) => {
  const log = console.log;
  console.log = function (text, err) {
    if (disableLogging) {
      return;
    }
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
  makeTimeHR,
  now,
  monkeyPatchConsole,
};
