// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title AetherisRegistry
 * @dev Protocol for decentralized digital registration and proof of existence.
 */
contract AetherisRegistry {
    struct Proof {
        bytes32 contentHash;
        string ipfsCid;
        uint256 timestamp;
        address owner;
        bool exists;
    }

    // Mapping from content hash to Proof
    mapping(bytes32 => Proof) public proofs;
    
    // Mapping from owner to their list of content hashes
    mapping(address => bytes32[]) public userProofs;

    event ProofRegistered(bytes32 indexed contentHash, address indexed owner, string ipfsCid, uint256 timestamp);

    /**
     * @dev Registers a new proof of existence.
     * @param _contentHash The SHA-256 hash of the encrypted content.
     * @param _ipfsCid The IPFS Content Identifier where the encrypted data is stored.
     */
    function registerProof(bytes32 _contentHash, string memory _ipfsCid) external {
        require(!proofs[_contentHash].exists, "Proof already exists");

        proofs[_contentHash] = Proof({
            contentHash: _contentHash,
            ipfsCid: _ipfsCid,
            timestamp: block.timestamp,
            owner: msg.sender,
            exists: true
        });

        userProofs[msg.sender].push(_contentHash);

        emit ProofRegistered(_contentHash, msg.sender, _ipfsCid, block.timestamp);
    }

    /**
     * @dev Verifies if a proof exists and returns its details.
     */
    function verifyProof(bytes32 _contentHash) external view returns (
        string memory ipfsCid,
        uint256 timestamp,
        address owner,
        bool exists
    ) {
        Proof memory p = proofs[_contentHash];
        return (p.ipfsCid, p.timestamp, p.owner, p.exists);
    }

    /**
     * @dev Returns all proof hashes for a specific user.
     */
    function getUserProofs(address _user) external view returns (bytes32[] memory) {
        return userProofs[_user];
    }
}
