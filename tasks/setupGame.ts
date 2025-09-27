import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

task("setup-game")
  .addParam("contract", "The RPG contract address")
  .addOptionalParam("answers", "Comma-separated correct answers (1,1,2,1)", "1,1,2,1")
  .setDescription("Set up the RPG game with correct answers")
  .setAction(async function (taskArguments: TaskArguments, { ethers, fhevm }) {
    const { contract: contractAddress, answers } = taskArguments;

    console.log("Setting up RPG game at:", contractAddress);

    const [signer] = await ethers.getSigners();
    const rpgGame = await ethers.getContractAt("RPGGame", contractAddress);

    // Parse answers
    const correctAnswers = answers.split(",").map((a: string) => parseInt(a.trim()));

    if (correctAnswers.length !== 4) {
      throw new Error("Must provide exactly 4 answers");
    }

    console.log("Correct answers:", correctAnswers);

    // Create encrypted inputs for the correct answers
    const input = fhevm.createEncryptedInput(contractAddress, signer.address);

    correctAnswers.forEach((answer: number) => {
      input.add8(answer);
    });

    const encryptedInput = await input.encrypt();

    console.log("Encrypted input created, setting correct answers...");

    // Set the correct answers
    const tx = await rpgGame.setCorrectAnswers(
      [
        encryptedInput.handles[0],
        encryptedInput.handles[1],
        encryptedInput.handles[2],
        encryptedInput.handles[3]
      ],
      encryptedInput.inputProof
    );

    await tx.wait();

    console.log("Game setup completed!");
    console.log("Transaction hash:", tx.hash);
    console.log("Players can now start the game!");
  });