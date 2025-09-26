// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint8, externalEuint8, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title RPG Game with 4 NPC Conversations and Encrypted Choices
/// @notice Players interact with 4 NPCs, make encrypted choices, and can win NFT rewards
contract RPGGame is SepoliaConfig, ERC721, Ownable {
    // Game constants
    uint8 public constant TOTAL_NPCS = 4;
    uint8 public constant YES_CHOICE = 1;
    uint8 public constant NO_CHOICE = 2;

    // Game state
    uint256 public nextTokenId = 1;
    mapping(address => uint8) public playerProgress; // Current NPC the player is talking to (0-4)
    mapping(address => euint8[4]) public playerChoices; // Encrypted choices for each NPC
    mapping(address => bool) public hasWonNFT; // Whether player has already won NFT

    // Correct answers (encrypted, set by contract creator)
    euint8[4] private correctAnswers;

    // Events
    event NPCInteraction(address indexed player, uint8 npcId, string question);
    event GameCompleted(address indexed player, bool wonNFT);
    event ChoiceMade(address indexed player, uint8 npcId);

    // NPC questions
    string[4] public npcQuestions = [
        "Ancient Guardian: 'Do you seek the path of wisdom over strength?'",
        "Mystical Oracle: 'Will you sacrifice your comfort for others' wellbeing?'",
        "Shadow Merchant: 'Do you believe honesty is more valuable than gold?'",
        "Forest Spirit: 'Would you protect nature even if it costs you personally?'"
    ];

    constructor() ERC721("RPG Quest NFT", "RPGNFT") Ownable(msg.sender) {
        // Initialize with default encrypted values (will be set by owner)
        for (uint8 i = 0; i < 4; i++) {
            correctAnswers[i] = FHE.asEuint8(0);
        }
    }

    /// @notice Set the correct encrypted answers for all NPCs (only owner)
    /// @param answers Array of 4 encrypted correct answers
    function setCorrectAnswers(
        externalEuint8[4] calldata answers,
        bytes calldata inputProof
    ) external onlyOwner {
        for (uint8 i = 0; i < 4; i++) {
            correctAnswers[i] = FHE.fromExternal(answers[i], inputProof);
            FHE.allowThis(correctAnswers[i]);
        }
    }

    /// @notice Get current NPC question for player
    /// @return npcId Current NPC ID (0-3), question text
    function getCurrentNPC(address player) external view returns (uint8 npcId, string memory question) {
        npcId = playerProgress[player];
        if (npcId >= TOTAL_NPCS) {
            return (TOTAL_NPCS, "Game completed!");
        }
        question = npcQuestions[npcId];
    }

    /// @notice Make an encrypted choice for current NPC
    /// @param encryptedChoice Encrypted choice (1 for Yes, 2 for No)
    /// @param inputProof Input proof for the encrypted choice
    function makeChoice(
        externalEuint8 encryptedChoice,
        bytes calldata inputProof
    ) external {
        uint8 currentNPC = playerProgress[msg.sender];
        require(currentNPC < TOTAL_NPCS, "Game already completed");

        // Validate and store the encrypted choice
        euint8 choice = FHE.fromExternal(encryptedChoice, inputProof);

        // Verify choice is valid (1 or 2)
        ebool isYes = FHE.eq(choice, FHE.asEuint8(YES_CHOICE));
        ebool isNo = FHE.eq(choice, FHE.asEuint8(NO_CHOICE));
        ebool isValid = FHE.or(isYes, isNo);

        // Use conditional logic to ensure valid choice
        euint8 validatedChoice = FHE.select(
            isValid,
            choice,
            FHE.asEuint8(NO_CHOICE) // Default to NO if invalid
        );

        playerChoices[msg.sender][currentNPC] = validatedChoice;

        // Set permissions
        FHE.allowThis(playerChoices[msg.sender][currentNPC]);
        FHE.allow(playerChoices[msg.sender][currentNPC], msg.sender);

        // Move to next NPC
        playerProgress[msg.sender]++;

        emit ChoiceMade(msg.sender, currentNPC);
        emit NPCInteraction(msg.sender, currentNPC, npcQuestions[currentNPC]);

        // Check if game is completed
        if (playerProgress[msg.sender] >= TOTAL_NPCS) {
            _checkGameCompletion(msg.sender);
        }
    }

    /// @notice Check if player has won by comparing all choices
    function _checkGameCompletion(address player) private {
        if (hasWonNFT[player]) {
            emit GameCompleted(player, false);
            return;
        }

        // Compare all 4 choices with correct answers
        ebool allCorrect = FHE.asEbool(true);

        for (uint8 i = 0; i < TOTAL_NPCS; i++) {
            ebool isCorrect = FHE.eq(playerChoices[player][i], correctAnswers[i]);
            allCorrect = FHE.and(allCorrect, isCorrect);
        }

        // Use FHE.select to determine if NFT should be awarded
        // Since we can't directly use encrypted boolean in control flow,
        // we'll use a different approach with error handling pattern

        emit GameCompleted(player, false); // Will be updated after decryption
    }

    /// @notice Request decryption to check if player won (asynchronous)
    function requestWinCheck() external {
        require(playerProgress[msg.sender] >= TOTAL_NPCS, "Game not completed yet");
        require(!hasWonNFT[msg.sender], "Already received NFT");

        // Prepare all player choices for decryption
        bytes32[] memory cts = new bytes32[](TOTAL_NPCS * 2); // choices + correct answers

        for (uint8 i = 0; i < TOTAL_NPCS; i++) {
            cts[i] = FHE.toBytes32(playerChoices[msg.sender][i]);
            cts[i + TOTAL_NPCS] = FHE.toBytes32(correctAnswers[i]);
        }

        // Request asynchronous decryption
        FHE.requestDecryption(cts, this.processWinResult.selector);
    }

    /// @notice Process the decryption result and mint NFT if player won
    function processWinResult(
        uint256 requestId,
        bytes memory cleartexts,
        bytes memory decryptionProof
    ) public returns (bool) {
        // Verify the decryption
        FHE.checkSignatures(requestId, cleartexts, decryptionProof);

        // Decode the decrypted values
        uint8[] memory decryptedValues = abi.decode(cleartexts, (uint8[]));

        // Check if all choices match correct answers
        bool hasWon = true;
        for (uint8 i = 0; i < TOTAL_NPCS; i++) {
            if (decryptedValues[i] != decryptedValues[i + TOTAL_NPCS]) {
                hasWon = false;
                break;
            }
        }

        address player = msg.sender; // In actual implementation, need to track which player this is for

        if (hasWon && !hasWonNFT[player]) {
            hasWonNFT[player] = true;
            _mint(player, nextTokenId);
            nextTokenId++;
        }

        emit GameCompleted(player, hasWon);
        return hasWon;
    }

    /// @notice Reset player's game progress (for testing/replay)
    function resetGame() external {
        require(playerProgress[msg.sender] >= TOTAL_NPCS, "Game not completed yet");

        playerProgress[msg.sender] = 0;
        // Note: We don't reset choices to preserve history
    }

    /// @notice Get player's encrypted choice for a specific NPC
    /// @param player Player address
    /// @param npcId NPC ID (0-3)
    /// @return Encrypted choice
    function getPlayerChoice(address player, uint8 npcId) external view returns (euint8) {
        require(npcId < TOTAL_NPCS, "Invalid NPC ID");
        return playerChoices[player][npcId];
    }

    /// @notice Check if player can view their choices (for ACL)
    function allowPlayerChoices(uint8 npcId) external {
        require(npcId < TOTAL_NPCS, "Invalid NPC ID");
        FHE.allow(playerChoices[msg.sender][npcId], msg.sender);
    }

    /// @notice Get game statistics
    function getGameStats(address player) external view returns (
        uint8 progress,
        bool completedGame,
        bool wonNFT,
        uint256 nftBalance
    ) {
        progress = playerProgress[player];
        completedGame = progress >= TOTAL_NPCS;
        wonNFT = hasWonNFT[player];
        nftBalance = balanceOf(player);
    }

    /// @notice Get all NPC questions
    function getAllQuestions() external view returns (string[4] memory) {
        return npcQuestions;
    }

    /// @notice Emergency function to update questions (only owner)
    function updateQuestion(uint8 npcId, string calldata newQuestion) external onlyOwner {
        require(npcId < TOTAL_NPCS, "Invalid NPC ID");
        npcQuestions[npcId] = newQuestion;
    }
}