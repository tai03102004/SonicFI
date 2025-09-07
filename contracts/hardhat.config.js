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

module.exports = {
    solidity: {
        version: "0.8.20",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
            viaIR: true,
        },
    },
    networks: {
        hardhat: {
            chainId: 31337,
        },
        localhost: {
            url: "http://127.0.0.1:8545",
            chainId: 31337,
        },
        sonic: {
            url: SONIC_RPC_URL,
            accounts: [PRIVATE_KEY],
            chainId: 146, // ✅ FIXED: Correct Sonic mainnet chain ID
            gasPrice: "auto",
            timeout: 120000,
        },
        sonicTestnet: {
            url: SONIC_TESTNET_RPC_URL,
            accounts: [PRIVATE_KEY],
            chainId: 14601, // ✅ FIXED: Correct Sonic testnet chain ID  
            gasPrice: "auto",
            timeout: 120000,
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
                chainId: 14601,
                urls: {
                    apiURL: "https://api.testnet.soniclabs.com/api",
                    browserURL: "https://testnet.soniclabs.com",
                },
            },
        ],
    },
    gasReporter: {
        enabled: process.env.REPORT_GAS === "true",
        currency: "USD",
        gasPrice: 20,
        coinmarketcap: COINMARKETCAP_API_KEY,
    },
    contractSizer: {
        alphaSort: true,
        runOnCompile: true,
        disambiguatePaths: false,
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts",
    },
};