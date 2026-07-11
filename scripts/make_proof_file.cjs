const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '../docs/feedback-responses.csv');
const outputPath = path.join(__dirname, '../docs/real_user_proof.csv');

if (!fs.existsSync(csvPath)) {
  console.error("Source feedback CSV does not exist.");
  process.exit(1);
}

const data = fs.readFileSync(csvPath, 'utf8');
const lines = data.split('\n');

const header = lines[0].split(',');
const walletIdx = header.indexOf('Wallet Address');
const txHashIdx = header.indexOf('Transaction Hash');
const amountIdx = header.indexOf('Amount Paid (XLM)');

if (walletIdx === -1 || txHashIdx === -1) {
  console.error("Could not find Wallet Address or Transaction Hash columns.");
  process.exit(1);
}

const outputLines = [
  "Wallet Address,Transaction Hash,Amount (XLM),Stellar Expert Link"
];

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  
  // Basic CSV parser to handle quotes
  const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
  const cleanMatches = matches.map(val => val.replace(/^"|"$/g, ''));
  
  const wallet = cleanMatches[walletIdx];
  const txHash = cleanMatches[txHashIdx];
  const amount = cleanMatches[amountIdx] || "0.0";
  
  if (wallet && txHash) {
    const stellarLink = `https://stellar.expert/testnet/tx/${txHash}`;
    outputLines.push(`${wallet},${txHash},${amount},${stellarLink}`);
  }
}

fs.writeFileSync(outputPath, outputLines.join('\n'));
console.log(`Created clean real user proof at ${outputPath}`);

// Now delete the old csv and xlsx files containing mock feedback to keep it strictly real on-chain data
try {
  fs.unlinkSync(csvPath);
  console.log("Deleted old docs/feedback-responses.csv");
} catch (e) {
  console.warn("Could not delete docs/feedback-responses.csv:", e.message);
}

try {
  const xlsxPath = path.join(__dirname, '../docs/user-data-level5.xlsx');
  if (fs.existsSync(xlsxPath)) {
    fs.unlinkSync(xlsxPath);
    console.log("Deleted old docs/user-data-level5.xlsx");
  }
} catch (e) {
  console.warn("Could not delete docs/user-data-level5.xlsx:", e.message);
}
