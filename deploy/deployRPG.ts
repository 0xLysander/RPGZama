import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  console.log("Deploying RPGGame contract with account:", deployer);

  const rpgGame = await deploy("RPGGame", {
    from: deployer,
    args: [], // Constructor has no arguments
    log: true,
    deterministicDeployment: false,
  });

  console.log("RPGGame deployed to:", rpgGame.address);
  console.log("Transaction hash:", rpgGame.transactionHash);

  // Set up correct answers after deployment (example)
  if (hre.network.name !== "hardhat") {
    console.log("Don't forget to set correct answers using setCorrectAnswers()");
  }
};

func.tags = ["RPGGame"];
func.dependencies = [];

export default func;