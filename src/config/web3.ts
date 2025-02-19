import { createConfig, http } from 'wagmi';
import { baseSepolia, base } from 'viem/chains';
import { injected } from 'wagmi/connectors';

// Configure the Base Sepolia chain
const configuredBaseSepolia = {
  ...baseSepolia,
  rpcUrls: {
    ...baseSepolia.rpcUrls,
    default: {
      ...baseSepolia.rpcUrls.default,
      http: ['https://sepolia.base.org'],
    },
  },
};

// Configure the Base Mainnet chain
const configuredBase = {
  ...base,
  rpcUrls: {
    ...base.rpcUrls,
    default: {
      ...base.rpcUrls.default,
      http: ['https://mainnet.base.org'],
    },
  },
};

export const config = createConfig({
  chains: [configuredBaseSepolia, configuredBase],
  connectors: [
    injected({
      target: 'metaMask'
    })
  ],
  transports: {
    [configuredBaseSepolia.id]: http(),
    [configuredBase.id]: http(),
  },
}); 