import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

// Initialize answers: 4 choices (1=yes, 2=no)
task("rpg:init-answers", "Initialize encrypted answers for RPGZama")
  .addOptionalParam("address", "Optionally specify RPGZama address")
  .addParam("a1", "Answer 1 (1 or 2)")
  .addParam("a2", "Answer 2 (1 or 2)")
  .addParam("a3", "Answer 3 (1 or 2)")
  .addParam("a4", "Answer 4 (1 or 2)")
  .setAction(async function (args: TaskArguments, hre) {
    const { deployments, ethers, fhevm } = hre;

    const dep = args.address ? { address: args.address } : await deployments.get("RPGZama");
    const signers = await ethers.getSigners();

    const v1 = parseInt(args.a1);
    const v2 = parseInt(args.a2);
    const v3 = parseInt(args.a3);
    const v4 = parseInt(args.a4);
    if (![v1, v2, v3, v4].every((v) => v === 1 || v === 2)) {
      throw new Error("Answers must be 1 or 2");
    }

    await fhevm.initializeCLIApi();

    const input = fhevm.createEncryptedInput(dep.address, signers[0].address);
    input.add8(v1);
    input.add8(v2);
    input.add8(v3);
    input.add8(v4);
    const enc = await input.encrypt();

    const rpg = await ethers.getContractAt("RPGZama", dep.address);
    const tx = await rpg
      .connect(signers[0])
      .initializeAnswers(enc.handles[0], enc.handles[1], enc.handles[2], enc.handles[3], enc.inputProof);
    console.log(`initializeAnswers tx: ${tx.hash}`);
    await tx.wait();
    console.log(`Initialized answers on ${dep.address}`);
  });

// Submit choices
task("rpg:submit", "Submit encrypted choices for RPGZama")
  .addOptionalParam("address", "Optionally specify RPGZama address")
  .addParam("c1", "Choice 1 (1 or 2)")
  .addParam("c2", "Choice 2 (1 or 2)")
  .addParam("c3", "Choice 3 (1 or 2)")
  .addParam("c4", "Choice 4 (1 or 2)")
  .setAction(async function (args: TaskArguments, hre) {
    const { deployments, ethers, fhevm } = hre;

    const dep = args.address ? { address: args.address } : await deployments.get("RPGZama");
    const signers = await ethers.getSigners();

    const v = [parseInt(args.c1), parseInt(args.c2), parseInt(args.c3), parseInt(args.c4)];
    if (!v.every((x) => x === 1 || x === 2)) throw new Error("Choices must be 1 or 2");

    await fhevm.initializeCLIApi();
    const input = fhevm.createEncryptedInput(dep.address, signers[0].address);
    input.add8(v[0]);
    input.add8(v[1]);
    input.add8(v[2]);
    input.add8(v[3]);
    const enc = await input.encrypt();

    const rpg = await ethers.getContractAt("RPGZama", dep.address);
    const tx = await rpg
      .connect(signers[0])
      .submitChoices(enc.handles[0], enc.handles[1], enc.handles[2], enc.handles[3], enc.inputProof);
    console.log(`submitChoices tx: ${tx.hash}`);
    await tx.wait();
  });

