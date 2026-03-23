/**
 * IPFS utility using Pinata as a pinning service for the MVP.
 * In a production environment, this would use a decentralized gateway or local node.
 */

const PINATA_API_KEY = process.env.VITE_PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.VITE_PINATA_SECRET_KEY;

export async function uploadToIPFS(data: any, name: string): Promise<string> {
  if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
    console.warn("Pinata API keys missing. Using mock CID for demonstration.");
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return "Qm" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;
  
  const body = {
    pinataContent: data,
    pinataMetadata: {
      name: name,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'pinata_api_key': PINATA_API_KEY,
      'pinata_secret_api_key': PINATA_SECRET_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`IPFS upload failed: ${response.statusText}`);
  }

  const result = await response.json();
  return result.IpfsHash;
}

export async function fetchFromIPFS(cid: string): Promise<any> {
  // Using a public gateway
  const url = `https://gateway.pinata.cloud/ipfs/${cid}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch from IPFS: ${response.statusText}`);
  }

  return await response.json();
}
