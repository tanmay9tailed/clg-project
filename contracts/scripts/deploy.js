import hre from "hardhat";

const { ethers } = hre;

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log(`Deploying contract with wallet: ${deployer.address}`);

  const Certificate = await ethers.getContractFactory("Certificate");
  const certificate = await Certificate.deploy();

  await certificate.waitForDeployment();

  console.log(`Certificate deployed to: ${await certificate.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
