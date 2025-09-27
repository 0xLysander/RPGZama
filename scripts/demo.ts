import { ethers, fhevm } from "hardhat";

async function main() {
  console.log("🎮 RPG Zama Demo Script");
  console.log("=======================\n");

  const [deployer, player1, player2] = await ethers.getSigners();

  // This assumes the contract is already deployed
  // Replace with actual deployed contract address
  const contractAddress = "0x..."; // Update this with deployed address

  if (contractAddress === "0x...") {
    console.log("❌ Please update the contract address in this script");
    console.log("📋 Deploy the contract first using:");
    console.log("   npx hardhat run scripts/deployAndSetup.ts --network sepolia\n");
    return;
  }

  console.log("📋 Contract Address:", contractAddress);
  console.log("👤 Player 1:", player1.address);
  console.log("👤 Player 2:", player2.address);
  console.log("");

  const rpgGame = await ethers.getContractAt("RPGGame", contractAddress);

  // Demo Player 1 - Making correct choices (will win NFT)
  console.log("🎯 Player 1 Demo - Making CORRECT choices (Yes, Yes, No, Yes)");
  console.log("=".repeat(60));

  const correctChoices = [1, 1, 2, 1]; // Yes, Yes, No, Yes

  for (let i = 0; i < 4; i++) {
    console.log(`\n🗣️  NPC ${i + 1} Interaction:`);

    // Get current NPC info
    const [npcId, question] = await rpgGame.getCurrentNPC(player1.address);
    console.log(`   Question: ${question}`);

    // Create encrypted choice
    const input = fhevm.createEncryptedInput(contractAddress, player1.address);
    input.add8(correctChoices[i]);

    console.log(`   Choice: ${correctChoices[i] === 1 ? 'Yes' : 'No'} (encrypted)`);

    const encryptedInput = await input.encrypt();

    // Make the choice
    const tx = await rpgGame.connect(player1).makeChoice(
      encryptedInput.handles[0],
      encryptedInput.inputProof
    );

    await tx.wait();
    console.log(`   ✅ Choice submitted! TX: ${tx.hash.substring(0, 10)}...`);

    // Check progress
    const stats = await rpgGame.getGameStats(player1.address);
    console.log(`   📊 Progress: ${stats.progress}/4`);
  }

  console.log("\n🏆 Player 1 completed the game!");
  const player1Stats = await rpgGame.getGameStats(player1.address);
  console.log(`   Game Completed: ${player1Stats.completedGame}`);
  console.log(`   Won NFT: ${player1Stats.wonNFT}`);
  console.log(`   NFT Balance: ${player1Stats.nftBalance}`);

  // Demo Player 2 - Making incorrect choices (will not win NFT)
  console.log("\n\n🎲 Player 2 Demo - Making INCORRECT choices (No, Yes, Yes, No)");
  console.log("=".repeat(60));

  const incorrectChoices = [2, 1, 1, 2]; // No, Yes, Yes, No

  for (let i = 0; i < 4; i++) {
    console.log(`\n🗣️  NPC ${i + 1} Interaction:`);

    const [npcId, question] = await rpgGame.getCurrentNPC(player2.address);
    console.log(`   Question: ${question}`);

    const input = fhevm.createEncryptedInput(contractAddress, player2.address);
    input.add8(incorrectChoices[i]);

    console.log(`   Choice: ${incorrectChoices[i] === 1 ? 'Yes' : 'No'} (encrypted)`);

    const encryptedInput = await input.encrypt();

    const tx = await rpgGame.connect(player2).makeChoice(
      encryptedInput.handles[0],
      encryptedInput.inputProof
    );

    await tx.wait();
    console.log(`   ✅ Choice submitted! TX: ${tx.hash.substring(0, 10)}...`);

    const stats = await rpgGame.getGameStats(player2.address);
    console.log(`   📊 Progress: ${stats.progress}/4`);
  }

  console.log("\n🎮 Player 2 completed the game!");
  const player2Stats = await rpgGame.getGameStats(player2.address);
  console.log(`   Game Completed: ${player2Stats.completedGame}`);
  console.log(`   Won NFT: ${player2Stats.wonNFT}`);
  console.log(`   NFT Balance: ${player2Stats.nftBalance}`);

  // Show contract statistics
  console.log("\n📈 Contract Statistics:");
  console.log("=".repeat(30));
  console.log(`   Next Token ID: ${await rpgGame.nextTokenId()}`);

  // Show all questions
  console.log("\n📚 All NPC Questions:");
  console.log("=".repeat(30));
  const questions = await rpgGame.getAllQuestions();
  questions.forEach((question, index) => {
    console.log(`   ${index + 1}. ${question}`);
  });

  console.log("\n✨ Demo completed!");
  console.log("\n🔑 Key Points:");
  console.log("   • All choices are fully encrypted using Zama FHE");
  console.log("   • The blockchain cannot see players' actual choices");
  console.log("   • Only players with correct sequence win NFT rewards");
  console.log("   • Winning sequence: Yes, Yes, No, Yes");
  console.log("   • Players can reset and replay after completion");
}

main()
  .then(() => {
    console.log("\n🎉 Demo script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Demo failed:", error);
    process.exit(1);
  });