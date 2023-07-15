const { ethers, upgrades } = require("hardhat");
const fs = require('fs')
require("dotenv").config();
const data = require('../test/testdata.json')

async function main() {
  // deploy USD
  const USD = await ethers.getContractFactory("contracts/LPtoken.sol:LPtoken");
  const usd = await USD.deploy("usd", "usd", process.env.ADMIN_ADDRESS);
  await usd.deployed();
  console.log(
    `USD deployed to ${usd.address}`
  );
  data["usdAddress"] = usd.address

  // deploy LPToken
  const LPToken = await ethers.getContractFactory("contracts/LPtoken.sol:LPtoken");
  const lpToken = await LPToken.deploy("testing", "tst", process.env.ADMIN_ADDRESS);
  await lpToken.deployed();
  console.log(
    `LPToken deployed to ${lpToken.address}`
  );
  data["LPTokenAddress"] = lpToken.address

  // deploy RoleContract
  const Roles = await ethers.getContractFactory("RoleContract");
  const roleContract = await upgrades.deployProxy(Roles, [data.signerAddress, data.managerAddress, data.roles])
  await roleContract.deployed();
  console.log(
    `RoleContract deployed to ${roleContract.address}`
  );
  data["RoleContract"] = roleContract.address

  // deploy InvestPool
  const InvestPool = await ethers.getContractFactory("contracts/InvestPool.sol:InvestPool");
  let RoleSettingsSetter = data.RoleSettingsSetter
  for (const one of RoleSettingsSetter) {
    one.startTime = Math.floor(Date.now() / 1000) + one.startTime
    one.deadline = Math.floor(Date.now() / 1000) + one.deadline
  }
  const investPool = await InvestPool.deploy(lpToken.address, roleContract.address, usd.address, data.fundrisingWallet, data.baseFee, data.price, data.maxAmountToSell, data.managerAddress, RoleSettingsSetter)
  await investPool.deployed();
  console.log(
    `InvestPool deployed to ${investPool.address}`
  );
  data["InvestPool"] = investPool.address
  fs.writeFileSync(`test/testdata.json`, JSON.stringify(data))
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
