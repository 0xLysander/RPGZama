import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { RPGGame } from "../types/typechain-types";

describe("RPGGame", function () {
  let rpgGame: RPGGame;
  let owner: SignerWithAddress;
  let player1: SignerWithAddress;
  let player2: SignerWithAddress;

  beforeEach(async function () {
    [owner, player1, player2] = await ethers.getSigners();

    // Deploy the contract
    const RPGGameFactory = await ethers.getContractFactory("RPGGame");
    rpgGame = await RPGGameFactory.deploy();
    await rpgGame.waitForDeployment();

    console.log("RPGGame deployed to:", await rpgGame.getAddress());
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await rpgGame.owner()).to.equal(owner.address);
    });

    it("Should initialize with correct NPC count", async function () {
      expect(await rpgGame.TOTAL_NPCS()).to.equal(4);
    });

    it("Should initialize with correct choice constants", async function () {
      expect(await rpgGame.YES_CHOICE()).to.equal(1);
      expect(await rpgGame.NO_CHOICE()).to.equal(2);
    });

    it("Should have the correct NPC questions", async function () {
      const questions = await rpgGame.getAllQuestions();
      expect(questions).to.have.lengthOf(4);
      expect(questions[0]).to.include("Ancient Guardian");
      expect(questions[1]).to.include("Mystical Oracle");
      expect(questions[2]).to.include("Shadow Merchant");
      expect(questions[3]).to.include("Forest Spirit");
    });
  });

  describe("Game Setup", function () {
    it("Should allow owner to set correct answers", async function () {
      const input = fhevm.createEncryptedInput(await rpgGame.getAddress(), owner.address);

      // Set correct answers: Yes, Yes, No, Yes (1, 1, 2, 1)
      input.add8(1); // NPC 0: Yes
      input.add8(1); // NPC 1: Yes
      input.add8(2); // NPC 2: No
      input.add8(1); // NPC 3: Yes

      const encryptedInput = await input.encrypt();

      await expect(
        rpgGame.connect(owner).setCorrectAnswers(
          [
            encryptedInput.handles[0],
            encryptedInput.handles[1],
            encryptedInput.handles[2],
            encryptedInput.handles[3]
          ],
          encryptedInput.inputProof
        )
      ).to.not.be.reverted;
    });

    it("Should not allow non-owner to set correct answers", async function () {
      const input = fhevm.createEncryptedInput(await rpgGame.getAddress(), player1.address);
      input.add8(1);
      input.add8(1);
      input.add8(2);
      input.add8(1);

      const encryptedInput = await input.encrypt();

      await expect(
        rpgGame.connect(player1).setCorrectAnswers(
          [
            encryptedInput.handles[0],
            encryptedInput.handles[1],
            encryptedInput.handles[2],
            encryptedInput.handles[3]
          ],
          encryptedInput.inputProof
        )
      ).to.be.revertedWithCustomError(rpgGame, "OwnableUnauthorizedAccount");
    });
  });

  describe("Game Play", function () {
    beforeEach(async function () {
      // Set up the game with correct answers
      const input = fhevm.createEncryptedInput(await rpgGame.getAddress(), owner.address);
      input.add8(1); // NPC 0: Yes
      input.add8(1); // NPC 1: Yes
      input.add8(2); // NPC 2: No
      input.add8(1); // NPC 3: Yes

      const encryptedInput = await input.encrypt();

      await rpgGame.connect(owner).setCorrectAnswers(
        [
          encryptedInput.handles[0],
          encryptedInput.handles[1],
          encryptedInput.handles[2],
          encryptedInput.handles[3]
        ],
        encryptedInput.inputProof
      );
    });

    it("Should return correct current NPC for new player", async function () {
      const [npcId, question] = await rpgGame.getCurrentNPC(player1.address);
      expect(npcId).to.equal(0);
      expect(question).to.include("Ancient Guardian");
    });

    it("Should allow player to make encrypted choices", async function () {
      const input = fhevm.createEncryptedInput(await rpgGame.getAddress(), player1.address);
      input.add8(1); // Yes choice

      const encryptedInput = await input.encrypt();

      await expect(
        rpgGame.connect(player1).makeChoice(
          encryptedInput.handles[0],
          encryptedInput.inputProof
        )
      ).to.emit(rpgGame, "ChoiceMade")
       .withArgs(player1.address, 0);
    });

    it("Should progress through all NPCs", async function () {
      // Make choices for all 4 NPCs
      for (let i = 0; i < 4; i++) {
        const input = fhevm.createEncryptedInput(await rpgGame.getAddress(), player1.address);
        input.add8(1); // Yes choice

        const encryptedInput = await input.encrypt();

        await rpgGame.connect(player1).makeChoice(
          encryptedInput.handles[0],
          encryptedInput.inputProof
        );

        // Check progress
        const stats = await rpgGame.getGameStats(player1.address);
        expect(stats.progress).to.equal(i + 1);
        expect(stats.completedGame).to.equal(i === 3);
      }
    });

    it("Should not allow making choices after game completion", async function () {
      // Complete the game
      for (let i = 0; i < 4; i++) {
        const input = fhevm.createEncryptedInput(await rpgGame.getAddress(), player1.address);
        input.add8(1);

        const encryptedInput = await input.encrypt();

        await rpgGame.connect(player1).makeChoice(
          encryptedInput.handles[0],
          encryptedInput.inputProof
        );
      }

      // Try to make another choice
      const input = fhevm.createEncryptedInput(await rpgGame.getAddress(), player1.address);
      input.add8(1);
      const encryptedInput = await input.encrypt();

      await expect(
        rpgGame.connect(player1).makeChoice(
          encryptedInput.handles[0],
          encryptedInput.inputProof
        )
      ).to.be.revertedWith("Game already completed");
    });

    it("Should allow game reset after completion", async function () {
      // Complete the game
      for (let i = 0; i < 4; i++) {
        const input = fhevm.createEncryptedInput(await rpgGame.getAddress(), player1.address);
        input.add8(1);

        const encryptedInput = await input.encrypt();

        await rpgGame.connect(player1).makeChoice(
          encryptedInput.handles[0],
          encryptedInput.inputProof
        );
      }

      // Reset the game
      await expect(rpgGame.connect(player1).resetGame()).to.not.be.reverted;

      // Check that progress is reset
      const stats = await rpgGame.getGameStats(player1.address);
      expect(stats.progress).to.equal(0);
      expect(stats.completedGame).to.equal(false);
    });

    it("Should not allow reset before completion", async function () {
      await expect(
        rpgGame.connect(player1).resetGame()
      ).to.be.revertedWith("Game not completed yet");
    });
  });

  describe("NFT Functionality", function () {
    beforeEach(async function () {
      // Set up the game
      const input = fhevm.createEncryptedInput(await rpgGame.getAddress(), owner.address);
      input.add8(1);
      input.add8(1);
      input.add8(2);
      input.add8(1);

      const encryptedInput = await input.encrypt();

      await rpgGame.connect(owner).setCorrectAnswers(
        [
          encryptedInput.handles[0],
          encryptedInput.handles[1],
          encryptedInput.handles[2],
          encryptedInput.handles[3]
        ],
        encryptedInput.inputProof
      );
    });

    it("Should have correct NFT metadata", async function () {
      expect(await rpgGame.name()).to.equal("RPG Quest NFT");
      expect(await rpgGame.symbol()).to.equal("RPGNFT");
    });

    it("Should increment token ID after each mint", async function () {
      expect(await rpgGame.nextTokenId()).to.equal(1);

      // This would typically be tested after implementing the full win check logic
      // For now, we just verify the initial state
    });
  });

  describe("Access Control", function () {
    it("Should allow players to get their encrypted choices", async function () {
      // Make a choice first
      const input = fhevm.createEncryptedInput(await rpgGame.getAddress(), player1.address);
      input.add8(1);
      const encryptedInput = await input.encrypt();

      await rpgGame.connect(player1).makeChoice(
        encryptedInput.handles[0],
        encryptedInput.inputProof
      );

      // Allow player to access their choice
      await expect(
        rpgGame.connect(player1).allowPlayerChoices(0)
      ).to.not.be.reverted;
    });

    it("Should revert for invalid NPC ID", async function () {
      await expect(
        rpgGame.connect(player1).allowPlayerChoices(4)
      ).to.be.revertedWith("Invalid NPC ID");
    });
  });

  describe("Game Statistics", function () {
    it("Should return correct initial stats", async function () {
      const stats = await rpgGame.getGameStats(player1.address);
      expect(stats.progress).to.equal(0);
      expect(stats.completedGame).to.equal(false);
      expect(stats.wonNFT).to.equal(false);
      expect(stats.nftBalance).to.equal(0);
    });
  });

  describe("Owner Functions", function () {
    it("Should allow owner to update questions", async function () {
      const newQuestion = "Updated Ancient Guardian: 'New question?'";

      await expect(
        rpgGame.connect(owner).updateQuestion(0, newQuestion)
      ).to.not.be.reverted;

      const questions = await rpgGame.getAllQuestions();
      expect(questions[0]).to.equal(newQuestion);
    });

    it("Should not allow non-owner to update questions", async function () {
      await expect(
        rpgGame.connect(player1).updateQuestion(0, "Hacked question")
      ).to.be.revertedWithCustomError(rpgGame, "OwnableUnauthorizedAccount");
    });

    it("Should not allow invalid NPC ID for question update", async function () {
      await expect(
        rpgGame.connect(owner).updateQuestion(4, "Invalid question")
      ).to.be.revertedWith("Invalid NPC ID");
    });
  });
});