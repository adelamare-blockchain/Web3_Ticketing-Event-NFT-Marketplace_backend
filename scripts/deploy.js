// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.

// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require('hardhat');
const fs = require('fs');

// COMMAND TO USE (localhost):
// yarn hardhat run --network localhost scripts/deploy.js

async function main() {
  // Get the ContractFactories and Signers here.
  // deployer address
  const [deployer] = await ethers.getSigners();

  // deploy Marketplace contract
  const Marketplace = await ethers.getContractFactory('Marketplace');
  const marketplace = await Marketplace.deploy(2);
  await marketplace.deployed();
  console.log(
    'Marketplace deployed at the address :',
    marketplace.address
  );
  // deploy NFT contract
  const NFT = await ethers.getContractFactory('NFT');
  const nft = await NFT.deploy(marketplace.address);
  await nft.deployed();

  console.log('NFT Contract deployed at the address :', nft.address);
  console.log(
    'Deploying contracts with the account:',
    deployer.address
  );
  console.log(
    'Account balance:',
    (await deployer.getBalance()).toString()
  );
  const constantFileContent = `export const marketplaceAddress='${marketplace.address}';\nexport const NFTAddress='${nft.address}'; `;

  fs.writeFileSync(
    '../frontend/constant/constant.jsx',
    constantFileContent
  );

  // Save copies of each contracts abi and address to the frontend.
  //   saveFrontendFiles(marketplace, 'Marketplace');
  //   saveFrontendFiles(nft, 'NFT');
}

// function saveFrontendFiles(contract, name) {
//   const contractsDir =
//     __dirname + '/../../frontend/src/config/contractsData';

//   if (!fs.existsSync(contractsDir)) {
//     fs.mkdirSync(contractsDir);
//   }

//   fs.writeFileSync(
//     contractsDir + `/${name}-address.json`,
//     JSON.stringify({ address: contract.address }, undefined, 2)
//   );

//   const contractArtifact = artifacts.readArtifactSync(name);

//   fs.writeFileSync(
//     contractsDir + `/${name}.json`,
//     JSON.stringify(contractArtifact, null, 2)
//   );
// }

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
