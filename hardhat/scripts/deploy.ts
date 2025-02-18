import { ethers } from "hardhat";

async function main() {
  console.log("Deploying BaseIDE contract...");

  const BaseIDE = await ethers.getContractFactory("BaseIDE");
  const baseIDE = await BaseIDE.deploy();
  await baseIDE.waitForDeployment();

  console.log("BaseIDE deployed to:", await baseIDE.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 