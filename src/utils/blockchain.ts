import { ethers } from 'ethers';

// This is a placeholder address. In a real scenario, the user would deploy the contract.
const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000"; 

const ABI = [
    "function registerProof(bytes32 _contentHash, string memory _ipfsCid) external",
    "function verifyProof(bytes32 _contentHash) external view returns (string memory ipfsCid, uint256 timestamp, address owner, bool exists)",
    "function getUserProofs(address _user) external view returns (bytes32[] memory)",
    "event ProofRegistered(bytes32 indexed contentHash, address indexed owner, string ipfsCid, uint256 timestamp)"
];

export async function getContract(signer: ethers.Signer) {
    return new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
}

export async function connectWallet() {
    if (!(window as any).ethereum) {
        throw new Error("MetaMask not found");
    }

    const provider = new ethers.BrowserProvider((window as any).ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    
    return { provider, signer, address: accounts[0] };
}

export async function registerOnChain(signer: ethers.Signer, hash: string, cid: string) {
    // For MVP demonstration, if contract address is zero, we simulate success
    if (CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
        console.warn("Contract not deployed. Simulating blockchain transaction.");
        await new Promise(resolve => setTimeout(resolve, 2000));
        return { hash: "0x" + Math.random().toString(16).substring(2, 66) };
    }

    const contract = await getContract(signer);
    const tx = await contract.registerProof(hash, cid);
    return await tx.wait();
}
