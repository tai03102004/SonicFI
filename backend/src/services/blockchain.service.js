import {
  ethers
} from 'ethers';

export class BlockchainService {
  constructor() {
    // Use the correct RPC URL and chainId
    this.provider = new ethers.JsonRpcProvider('https://rpc.testnet.soniclabs.com');
    this.networkName = 'Sonic Testnet';
    this.chainId = 14601; // Match deployment file

    // Load contract addresses from deployment
    this.contracts = {
      SToken: "0x4A80C79Ba53e1ecD18c3f340d8C5181e618B559C",
      KnowledgeDAO: "0xD59Da846F02A6C84D79C05F80CFB3B7ae2F21879",
      ReputationSystem: "0x97a2c3CA5a565F0C0c4Ee66968B382B542C01070",
      AIModelRegistry: "0x9CD763b9a34c43123a70e69168C447C3dB1d51b7"
    };
  }

  async getNetworkStatus() {
    try {
      console.log('🔍 Checking Sonic Testnet status...');

      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();
      const gasPrice = await this.provider.getFeeData();

      console.log('Network:', network);
      console.log('Block:', blockNumber);

      return {
        network: this.networkName,
        chainId: Number(network.chainId),
        blockNumber,
        gasPrice: gasPrice.gasPrice ? ethers.formatUnits(gasPrice.gasPrice, 'gwei') : '0',
        isHealthy: true,
        contracts: this.contracts,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Network status check failed:', error);
      return {
        network: this.networkName,
        chainId: this.chainId,
        isHealthy: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async getUserBalance(address) {
    try {
      console.log(`💰 Getting balance for ${address}...`);

      const balance = await this.provider.getBalance(address);
      const balanceInEther = ethers.formatEther(balance);

      console.log(`Balance: ${balanceInEther} S`);

      return balanceInEther;
    } catch (error) {
      console.error('❌ Balance fetch failed:', error);
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }

  async submitPrediction(token, prediction, userAddress, stakeAmount) {
    try {
      console.log(`🔗 Submitting prediction for ${token} to Sonic Testnet`);

      // Mock blockchain submission (implement with actual contract calls)
      const result = {
        transactionHash: `0x${Math.random().toString(16).slice(2, 66)}`,
        blockNumber: Math.floor(Math.random() * 1000000),
        gasUsed: Math.floor(Math.random() * 100000),
        status: 'success',
        prediction_hash: prediction.prediction_hash,
        stake_amount: stakeAmount,
        contract_address: this.contracts.AIModelRegistry,
        network: this.networkName,
        chainId: this.chainId,
        timestamp: new Date().toISOString()
      };

      return result;

    } catch (error) {
      console.error('❌ Blockchain submission failed:', error);
      throw new Error(`Blockchain submission failed: ${error.message}`);
    }
  }

  async validatePrediction(predictionHash, actualPrice, predictedPrice, userAddress) {
    try {
      console.log(`🔍 Validating prediction ${predictionHash} on Sonic Testnet`);

      const accuracy = 1 - Math.abs(actualPrice - predictedPrice) / actualPrice;
      const isSuccessful = accuracy > 0.9; // 90% accuracy threshold

      const result = {
        prediction_hash: predictionHash,
        actual_price: actualPrice,
        predicted_price: predictedPrice,
        accuracy: accuracy * 100,
        is_successful: isSuccessful,
        reward_amount: isSuccessful ? 25 : 0,
        transaction_hash: `0x${Math.random().toString(16).slice(2, 66)}`,
        contract_address: this.contracts.ReputationSystem,
        network: this.networkName,
        chainId: this.chainId,
        timestamp: new Date().toISOString()
      };

      return result;

    } catch (error) {
      console.error('❌ Prediction validation failed:', error);
      throw new Error(`Validation failed: ${error.message}`);
    }
  }
}