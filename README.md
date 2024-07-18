# NFT Ticketing Event Marketplace - Backend Hardhat

## 📌 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Smart contracts](#-smart-contracts)
- [Getting Started](#-getting-started)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Gas Optimization](#-gas-optimization)
- [Security Considerations](#-security-considerations)
- [Future Enhancements](#-future-enhancements)
- [Contributing](#-contributing)
- [License](#-license)

## 🌟 Overview

This project implements the backend for an NFT Ticketing Event Marketplace. By leveraging NFTs (Non-Fungible Tokens), this cutting-edge decentralized application (dApp) provide a secure, transparent, and efficient platform for event organizers to create and sell tickets, while offering attendees a unique and verifiable digital asset.

## 🚀 Features

- **Event Creation**: Organizers can easily create and manage events with customizable parameters.
- **NFT Ticket Minting**: Generate unique NFT tickets for each event with embedded metadata.
- **Secure Marketplace**: List, buy, and sell NFT tickets with built-in royalties for organizers.
- **Ticket Verification**: Blockchain-based verification ensures ticket authenticity and prevents fraud.
- **Secondary Market**: Enable secure peer-to-peer ticket reselling with price caps to prevent scalping.
- **Event Discovery**: Users can browse and search for events using various filters.
- **Smart Contract Automation**: Automate ticket sales, distributions, and refunds using smart contracts.

## 💻 Tech Stack

- **Blockchain**: Ethereum, Polygon (Amoy Testnet)
- **Smart Contract**: Solidity ^0.8.19
- **Development Environment**: Hardhat
- **Testing**: Chai, Mocha
- **Frontend**: Next.js 13 (separate repository)
- **Styling**: TailwindCSS
- **Version Control**: Git, GitHub

## 🏗 Architecture

```graph TD
A[Frontend - Next.js] -->|Web3.js| B(Blockchain)
B --> C[Smart Contracts]
C -->|Manages| D[NFT.sol]
C -->|Manages| E[Marketplace.sol]
D -->|Mints| F[NFT Tickets]
E -->|Lists/Sells| F
E -->|Creates| G[Events]
```

## 📜 Smart Contracts

1. **`NFT.sol`**:

- Implements ERC721 standard for NFT tickets
- Custom minting function with metadata support
- Royalty mechanism for secondary sales

2. **`Marketplace.sol`**:

- Event creation and management
- Ticket listing and sales functionality
- Secondary market controls
- Revenue distribution to relevant parties

## 🏁 Getting Started

1. Clone the repository

```sh
git clone https://github.com/adelamare-blockchain/Web3_Ticketing-Event-NFT-Marketplace_backend.git
cd backend
```

2. Install dependencies:

```sh
yarn install
```

3. Set up environment variables:

```sh
cp .env.example .env
# Edit .env with your configuration
```

4. Compile smart contracts:

```sh
npx hardhat compile
```

## 🧪 Testing

We've implemented comprehensive tests to ensure the reliability and security of our smart contracts. Run the test suite with:

```sh
npx hardhat test
```

**Test Coverage**

```sh
| File | % Stmts | % Branch | % Funcs | % Lines |
|------------|--------|---------|--------|--------|
| Marketplace.sol | 100% | 95.45% | 100% | 100% |
| NFT.sol | 100% | 100% | 100% | 100% |
```

**Key Test Results**

```sh
Marketplace
Deployment
✓ Should deploy the contract correctly
✓ Should track name and symbol of the nft collection
✓ Should update the listing price
Event Creation
✓ Should create an event
✓ Should return all created events of the marketplace
NFT Minting
✓ Should track 3 new minted NFTs
✓ Should fail if ticketPrice is not equal to listingPrice
Market Operations
✓ Should transfer minted NFTs from seller to marketplace
✓ Should emit offered event for 2 new NFTs on marketplace
✓ Should return all the fetched market items
✓ Should return the fetch market items of one creator (addr1)
✓ Should return the fetch market items of one event (event1)
Sales
✓ Should update item as sold, pay seller, transfer NFT to buyer, and charge fees
✓ Should return the sold market item bought by addr3 with fetchMyNFTs()
✓ Should return all the unsold fetched market items

15 passing (7s)
```

## 🚀 Deployment

To deploy to Polygon Amoy testnet:

1. Ensure your `.env` file is configured with the correct private key and RPC URL

2. Run the deployment script:

```sh
npx hardhat run scripts/deploy.js --network amoy
```

3. Verify the contract on PolygonScan:

```sh
npx hardhat verify --network amoy DEPLOYED_CONTRACT_ADDRESS "Constructor argument 1"
```

## ⛽ Gas Optimization

We've implemented several gas optimization techniques to ensure efficient contract execution:

- Use of uint256 instead of uint8, uint16, etc.
- Appropriate use of view and pure functions
- Minimized storage reads/writes
- Use of events for off-chain tracking

\*\* Gas Usage Report

```
·----------------------------------------|---------------------------|-------------|-----------------------------·
|           Solc version: 0.8.19         ·  Optimizer enabled: true  ·  Runs: 200  ·  Block limit: 30000000 gas  │
·········································|···························|·············|······························
|  Methods                                                                                                       │
·················|······················|·············|·············|·············|···············|··············
|  Contract      ·  Method               ·  Min        ·  Max        ·  Avg        ·  # calls      ·  eur (avg)  │
·················|······················|·············|·············|·············|···············|··············
|  Marketplace   ·  createEvent          ·     302821  ·     319801  ·     311311  ·           30  ·          -  │
·················|······················|·············|·············|·············|···············|··············
|  Marketplace   ·  createMarketSale     ·     130575  ·     130587  ·     130581  ·            4  ·          -  │
·················|······················|·············|·············|·············|···············|··············
|  Marketplace   ·  createMarketTicket   ·     222138  ·     261150  ·     234870  ·           46  ·          -  │
·················|······················|·············|·············|·············|···············|··············
|  Marketplace   ·  updateListingPrice   ·          -  ·          -  ·      29770  ·            1  ·          -  │
·················|······················|·············|·············|·············|···············|··············
|  NFT           ·  mintNFT              ·      85807  ·     139907  ·     117832  ·           60  ·          -  │
·················|······················|·············|·············|·············|···············|··············
|  Deployments                           ·                                         ·  % of limit   ·             │
·········································|·············|·············|·············|···············|··············
|  Marketplace                           ·          -  ·          -  ·    2227441  ·        7.4 %  ·          -  │
·········································|·············|·············|·············|···············|··············
|  NFT                                   ·    1374951  ·    1374963  ·    1374962  ·        4.6 %  ·          -  │
·----------------------------------------|-------------|-------------|-------------|---------------|-------------·
```

## 🔒 Security Considerations

- Implemented reentrancy guards using OpenZeppelin's `ReentrancyGuard`
- Used SafeMath library for arithmetic operations
- Access control implemented with Ownable contract
- Thorough input validation in all public functions
- Events emitted for all critical state changes

## 🔮 Future Enhancements

1. Integration with decentralized identity solutions for KYC/AML compliance
2. Implementation of a governance token for community-driven decision making
3. Cross-chain compatibility for multi-blockchain support
4. Integration with layer-2 solutions for improved scalability

## 🤝 Contributing

We welcome contributions to the NFT Ticketing Event Marketplace! Any contributions you make are **greatly appreciated**.
Don't forget to give the project a star! Thanks again!

## 📄 License

This project is licensed under the MIT License - see the `LICENSE` file for details.

🚀 Developed with ❤️ by Antoine Delamare
