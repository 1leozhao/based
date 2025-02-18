# BaseIDE

A web-based IDE for writing and deploying smart contracts on Base, built with Next.js and Hardhat.

## Features

- Smart contract development environment
- Project management system
- Base network integration (Mainnet and Sepolia Testnet)
- Modern web interface

## Setup

1. Install dependencies:
```bash
npm install
cd hardhat && npm install
```

2. Configure environment:
Create a `.env` file in the root directory with:
```
PRIVATE_KEY=your_private_key_here
BASE_MAINNET_RPC_URL=https://mainnet.base.org
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
```

3. Development:
```bash
# Start the web interface
npm run dev

# Compile contracts
npm run compile

# Run tests
npm run test

# Deploy to Base Sepolia
npm run deploy:sepolia

# Deploy to Base Mainnet
npm run deploy:mainnet
```

## Project Structure

- `/src` - Next.js web application
- `/hardhat` - Smart contract development
  - `/contracts` - Solidity smart contracts
  - `/test` - Contract test files
  - `/scripts` - Deployment scripts

## Security

- Never commit your `.env` file
- Keep your private keys secure
- Test thoroughly on Sepolia before deploying to mainnet

## License

MIT
