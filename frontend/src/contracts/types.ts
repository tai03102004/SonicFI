export interface DeploymentInfo {
  network: string;
  chainId: number;
  deployer: string;
  timestamp: string;
  contracts: {
    SToken: string;
    KnowledgeDAO: string;
    ReputationSystem: string;
    AIModelRegistry: string;
  };
  gasUsed: string;
  verified?: boolean;
}

export interface ContractConfig {
  address: string;
  abi: string[] | any[];
}

export type ContractName = keyof DeploymentInfo["contracts"];

export interface ContractCallOptions {
  gasLimit?: number;
  gasPrice?: string;
  value?: string;
}

export interface TransactionReceipt {
  hash: string;
  blockNumber: number;
  gasUsed: string;
  status: number;
  events?: any[];
}
