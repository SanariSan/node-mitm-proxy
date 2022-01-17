const sleep = (ms) => new Promise((resolve, reject) => setTimeout(resolve, ms));

let stopperValue = false;

const switchStopperValue = () => (stopperValue = !stopperValue);

const getStopperValue = () => stopperValue;

const stopper = async () => {
  while (stopperValue) {
    await sleep(1);
  }
};

// const getHostPortFromString = function (hostString, defaultPort) {
//   let host = hostString;
//   let port = defaultPort;
//   const regex_hostport = /^([^:]+)(:([0-9]+))?$/;

//   const result = regex_hostport.exec(hostString);
//   if (result != null) {
//     host = result[1];
//     if (result[2] != null) {
//       port = result[3];
//     }
//   }

//   return [host, port];
// };

module.exports = {
  stopper,
  switchStopperValue,
  getStopperValue,
  sleep,
  // getHostPortFromString,
};
