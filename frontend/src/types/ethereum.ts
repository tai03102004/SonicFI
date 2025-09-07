declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, handler: (data: any) => void) => void;
      removeListener: (event: string, handler: (data: any) => void) => void;
    };
  }
}

export {};
