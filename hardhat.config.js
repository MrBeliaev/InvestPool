require("@nomicfoundation/hardhat-toolbox");
require('@openzeppelin/hardhat-upgrades');
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.18",
    // settings: {
    //   optimizer: {
    //     enabled: true,
    //     runs: 200
    //   }
    // }
  },

  gasReporter: {
    enabled: false,
  },
  networks: {
    mumbai: {
      url: "https://polygon-mumbai.blockpi.network/v1/rpc/public",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 80001,
    },
    polygon: {
      url: "https://polygon-bor.publicnode.com",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 137,
    }
  },
  etherscan: {
    apiKey: process.env.API_KEY,
  },
}
