import { ethers, fhevm } from "hardhat";

async function main() {
  console.log("🚀 Starting RPG Game deployment and setup...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)));

  // Deploy the RPG contract
  console.log("\n📋 Deploying RPGGame contract...");
  const RPGGameFactory = await ethers.getContractFactory("RPGGame");
  const rpgGame = await RPGGameFactory.deploy();
  await rpgGame.waitForDeployment();

  const contractAddress = await rpgGame.getAddress();
  console.log("✅ RPGGame deployed to:", contractAddress);

  // Wait for a few block confirmations
  console.log("⏳ Waiting for block confirmations...");
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Set up the correct answers
  console.log("\n🔐 Setting up encrypted correct answers...");

  // Default correct answers: Yes(1), Yes(1), No(2), Yes(1)
  // This means only players who choose: Yes, Yes, No, Yes will win the NFT
  const correctAnswers = [1, 1, 2, 1];
  console.log("Correct answers sequence:", correctAnswers.map((a, i) =>
    `NPC ${i + 1}: ${a === 1 ? 'Yes' : 'No'}`
  ));

  // Create encrypted inputs
  const input = fhevm.createEncryptedInput(contractAddress, deployer.address);

  correctAnswers.forEach((answer: number) => {
    input.add8(answer);
  });

  console.log("🔒 Encrypting answers...");
  const encryptedInput = await input.encrypt();

  console.log("📝 Setting correct answers in contract...");
  const setupTx = await rpgGame.setCorrectAnswers(
    [
      encryptedInput.handles[0],
      encryptedInput.handles[1],
      encryptedInput.handles[2],
      encryptedInput.handles[3]
    ],
    encryptedInput.inputProof
  );

  await setupTx.wait();
  console.log("✅ Correct answers set! Transaction hash:", setupTx.hash);

  // Display the NPC questions
  console.log("\n📚 Game NPCs and Questions:");
  const questions = await rpgGame.getAllQuestions();
  questions.forEach((question, index) => {
    console.log(`${index + 1}. ${question}`);
  });

  // Display game statistics
  console.log("\n📊 Game Configuration:");
  console.log(`- Total NPCs: ${await rpgGame.TOTAL_NPCS()}`);
  console.log(`- Yes choice value: ${await rpgGame.YES_CHOICE()}`);
  console.log(`- No choice value: ${await rpgGame.NO_CHOICE()}`);
  console.log(`- Next NFT Token ID: ${await rpgGame.nextTokenId()}`);

  // Update frontend configuration
  console.log("\n⚙️  Frontend Configuration:");
  console.log(`Contract Address: ${contractAddress}`);
  console.log("Update your frontend's CONTRACT_ADDRESS constant with this value");

  console.log("\n🎉 Deployment and setup completed successfully!");
  console.log("\n🎮 Game Rules:");
  console.log("- Players interact with 4 NPCs in sequence");
  console.log("- Each NPC asks a question with Yes/No answer");
  console.log("- All choices are encrypted using Zama FHE");
  console.log("- Only players with ALL correct answers win an NFT");
  console.log(`- Winning sequence: ${correctAnswers.map(a => a === 1 ? 'Yes' : 'No').join(', ')}`);

  return {
    contractAddress,
    correctAnswers,
    deployer: deployer.address
  };
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then((result) => {
    console.log("\n✨ All done! Contract ready for players.");
    console.log(`Contract: ${result.contractAddress}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });