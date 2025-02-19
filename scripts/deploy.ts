import { ethers } from "hardhat";

async function main() {
  console.log("Deploying Based contract...");
  
  // Get the contract factory
  const Based = await ethers.getContractFactory("Based");
  
  // Deploy the contract
  const based = await Based.deploy();
  await based.waitForDeployment();

  console.log("Based contract deployed to:", await based.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 