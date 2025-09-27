// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

// FHEVM
import {FHE, euint8, ebool, externalEuint8} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title RPGZama - Encrypted choice RPG with NFT reward
/// @notice Creator sets 4 encrypted correct answers. Users submit 4 encrypted choices.
/// If all choices are correct, the contract mints an ERC721 reward to the user
/// after decryption via the Zama decryption oracle callback.
contract RPGZama is SepoliaConfig {
    // ===== Minimal Ownable =====
    address public owner;
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // ===== Game State =====
    bool public initialized; // whether correct answers have been set
    euint8[4] private _correct; // encrypted answers: 1 for yes, 2 for no

    // user submission tracking
    mapping(address => bool) public hasSubmitted;
    mapping(address => bool) public decryptionPending;
    mapping(address => bool) public hasWon;
    mapping(uint256 => address) private requestIdToUser;

    // last encrypted result per user for testing/UX (true if all correct)
    mapping(address => ebool) private _lastAllCorrect;

    event AnswersInitialized(address indexed by);
    event ChoicesSubmitted(address indexed user, uint256 requestId);
    event WinnerMinted(address indexed user, uint256 tokenId);

    // ===== Minimal ERC721 =====
    string private _name;
    string private _symbol;
    uint256 private _nextTokenId;
    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;

    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
        _name = "RPGZama Reward";
        _symbol = "RZ-NFT";
        _nextTokenId = 1;
    }

    // ===== Ownable =====
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    // ===== Game Admin =====
    /// @notice Initialize the 4 encrypted correct answers (callable once by owner)
    /// @param a1..a4 external encrypted inputs (1 for yes, 2 for no)
    /// @param inputProof Zama input proof for external ciphertexts
    function initializeAnswers(
        externalEuint8 a1,
        externalEuint8 a2,
        externalEuint8 a3,
        externalEuint8 a4,
        bytes calldata inputProof
    ) external onlyOwner {
        require(!initialized, "Already initialized");

        _correct[0] = FHE.fromExternal(a1, inputProof);
        _correct[1] = FHE.fromExternal(a2, inputProof);
        _correct[2] = FHE.fromExternal(a3, inputProof);
        _correct[3] = FHE.fromExternal(a4, inputProof);

        for (uint256 i = 0; i < 4; i++) {
            FHE.allowThis(_correct[i]);
        }

        initialized = true;
        emit AnswersInitialized(msg.sender);
    }

    // ===== Player Flow =====
    /// @notice Submit 4 encrypted choices (1=yes, 2=no). Triggers decryption request.
    function submitChoices(
        externalEuint8 c1,
        externalEuint8 c2,
        externalEuint8 c3,
        externalEuint8 c4,
        bytes calldata inputProof
    ) external {
        require(initialized, "Not initialized");
        require(!decryptionPending[msg.sender], "Pending");

        // Validate and import encrypted inputs
        euint8 v1 = FHE.fromExternal(c1, inputProof);
        euint8 v2 = FHE.fromExternal(c2, inputProof);
        euint8 v3 = FHE.fromExternal(c3, inputProof);
        euint8 v4 = FHE.fromExternal(c4, inputProof);

        // Compare with correct answers (all encrypted)
        ebool eq1 = FHE.eq(v1, _correct[0]);
        ebool eq2 = FHE.eq(v2, _correct[1]);
        ebool eq3 = FHE.eq(v3, _correct[2]);
        ebool eq4 = FHE.eq(v4, _correct[3]);

        ebool allCorrect = FHE.and(FHE.and(eq1, eq2), FHE.and(eq3, eq4));

        // Store last encrypted result for the user (for testing/UX)
        _lastAllCorrect[msg.sender] = allCorrect;
        FHE.allowThis(allCorrect);
        FHE.allow(allCorrect, msg.sender);

        // Request public decryption of allCorrect -> async callback will mint if true
        bytes32[] memory cts = new bytes32[](1);
        cts[0] = FHE.toBytes32(allCorrect);
        uint256 requestId = FHE.requestDecryption(cts, this.decryptionCallback.selector);

        requestIdToUser[requestId] = msg.sender;
        hasSubmitted[msg.sender] = true;
        decryptionPending[msg.sender] = true;

        emit ChoicesSubmitted(msg.sender, requestId);
    }

    /// @notice Oracle callback. Mints NFT if user's result decrypts to true
    /// @dev Validates proof and ties requestId back to the user that submitted.
    function decryptionCallback(
        uint256 requestId,
        bytes memory cleartexts,
        bytes memory decryptionProof
    ) public returns (bool) {
        address user = requestIdToUser[requestId];
        require(user != address(0), "Unknown request");

        // Verify decryption proofs
        FHE.checkSignatures(requestId, cleartexts, decryptionProof);

        (bool isWinner) = abi.decode(cleartexts, (bool));
        decryptionPending[user] = false;

        if (isWinner && !hasWon[user]) {
            _mint(user);
            hasWon[user] = true;
        }
        return isWinner;
    }

    /// @notice Returns user status flags
    function getStatus(address user)
        external
        view
        returns (
            bool submitted,
            bool pending,
            bool won
        )
    {
        return (hasSubmitted[user], decryptionPending[user], hasWon[user]);
    }

    /// @notice Returns last encrypted correctness flag for a user
    function getLastAllCorrect(address user) external view returns (ebool) {
        return _lastAllCorrect[user];
    }

    // ===== Minimal ERC721 =====
    function name() external view returns (string memory) {
        return _name;
    }

    function symbol() external view returns (string memory) {
        return _symbol;
    }

    function balanceOf(address account) external view returns (uint256) {
        require(account != address(0), "Zero");
        return _balances[account];
    }

    function ownerOf(uint256 tokenId) external view returns (address) {
        address o = _owners[tokenId];
        require(o != address(0), "No token");
        return o;
    }

    function _mint(address to) internal {
        require(to != address(0), "Zero");
        uint256 tokenId = _nextTokenId++;
        _owners[tokenId] = to;
        _balances[to] += 1;
        emit WinnerMinted(to, tokenId);
    }
}

