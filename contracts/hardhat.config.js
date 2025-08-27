require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("@openzeppelin/hardhat-upgrades");
require("hardhat-contract-sizer");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0000000000000000000000000000000000000000000000000000000000000000";
const SONIC_RPC_URL = process.env.SONIC_RPC_URL || "https://rpc.sonic.network";
const SONIC_TESTNET_RPC_URL = process.env.SONIC_TESTNET_RPC_URL || "https://rpc.testnet.sonic.network";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: {
        version: "0.8.19",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
                details: {
                    yul: false,
                },
            },
            viaIR: true,
        },
    },
    networks: {
        hardhat: {
            chainId: 31337,
            forking: {
                url: SONIC_RPC_URL,
                enabled: false,
            },
            accounts: {
                mnemonic: "test test test test test test test test test test test junk",
                count: 20,
                accountsBalance: "10000000000000000000000", // 10,000 ETH
            },
        },
        localhost: {
            url: "http://127.0.0.1:8545",
            chainId: 31337,
        },
        sonic: {
            url: SONIC_RPC_URL,
            accounts: [PRIVATE_KEY],
            chainId: 146, // Sonic mainnet chain ID
            gasPrice: "auto",
            timeout: 60000,
        },
        sonicTestnet: {
            url: SONIC_TESTNET_RPC_URL,
            accounts: [PRIVATE_KEY],
            chainId: 57054, // Sonic testnet chain ID  
            gasPrice: "auto",
            timeout: 60000,
        },
    },
    etherscan: {
        apiKey: {
            sonic: ETHERSCAN_API_KEY,
            sonicTestnet: ETHERSCAN_API_KEY,
        },
        customChains: [{
                network: "sonic",
                chainId: 146,
                urls: {
                    apiURL: "https://api.sonicscan.org/api",
                    browserURL: "https://sonicscan.org",
                },
            },
            {
                network: "sonicTestnet",
                chainId: 57054,
                urls: {
                    apiURL: "https://api.testnet.sonicscan.org/api",
                    browserURL: "https://testnet.sonicscan.org",
                },
            },
        ],
    },
    sourcify: {
        enabled: true,
    },
    gasReporter: {
        enabled: process.env.REPORT_GAS === "true",
        currency: "USD",
        gasPrice: 20,
        coinmarketcap: COINMARKETCAP_API_KEY,
        showTimeSpent: true,
        showMethodSig: true,
    },
    contractSizer: {
        alphaSort: true,
        runOnCompile: true,
        disambiguatePaths: false,
    },
    typechain: {
        outDir: "typechain-types",
        target: "ethers-v6",
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts",
    },
    mocha: {
        timeout: 300000, // 5 minutes
    },
};