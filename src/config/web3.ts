import { createConfig } from 'wagmi';
import { baseSepolia, base } from 'viem/chains';
import { injected } from 'wagmi/connectors';

export const config = createConfig({
  chains: [baseSepolia, base],
  connectors: [
    injected({
      target: 'metaMask'
    })
  ],
}); 