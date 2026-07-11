const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '../docs/real_user_proof.csv');

if (!fs.existsSync(csvPath)) {
  console.error("real_user_proof.csv does not exist.");
  process.exit(1);
}

const csvData = fs.readFileSync(csvPath, 'utf8');
const lines = csvData.split('\n');
const newLines = [];

for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed) continue;
  
  const parts = trimmed.split(',');
  // Keep only Wallet Address, Transaction Hash, Amount (first 3 columns)
  if (parts.length >= 3) {
    newLines.push([parts[0], parts[1], parts[2]].join(','));
  }
}

fs.writeFileSync(csvPath, newLines.join('\n'));
console.log("Successfully removed links from docs/real_user_proof.csv");
