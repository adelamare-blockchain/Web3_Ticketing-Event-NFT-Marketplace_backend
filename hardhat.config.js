require("@nomiclabs/hardhat-ethers");
require("@nomicfoundation/hardhat-chai-matchers");
require("hardhat-gas-reporter");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  paths: {
    artifacts: "../frontend/src/artifacts",
  },
  defaultNetwork: "hardhat",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    // hardhat: {
    //   chainId: 1337,
    // },

    // amoy: {
    //   url: 'https://rpc-amoy.polygon.technology',
    //   accounts: [`0x${process.env.PRIVATE_KEY}`],
    // },
    // amoy2: {
    //   url: 'https://rpc.ankr.com/polygon_amoy',
    //   accounts: [`0x${process.env.PRIVATE_KEY}`],
    // },
    // amoy3: {
    //   url: 'https://polygon-amoy.drpc.org',
    //   accounts: [`0x${process.env.PRIVATE_KEY}`],
    // },
  },
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  gasReporter: {
    currency: "EUR",
    gasPrice: 21,
  },
};
