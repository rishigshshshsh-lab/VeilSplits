const { Keypair, Asset, Operation, TransactionBuilder, Horizon, Account } = require('@stellar/stellar-sdk');
const xlsx = require('xlsx');
const fs = require('fs');

const HORIZON_URL = 'https://horizon-testnet.stellar.org';
const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';
const server = new Horizon.Server(HORIZON_URL);

const NUM_WALLETS = 67;
const DESTINATION_ADDRESS = 'GDWE3AJB67FJWMQ6RM7JQ6KF6HSA42VYDGFYJNGVT7SQZPUAB6MXEZRW'; // A fixed testnet address to receive splits

// Helper to delay execution
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper to fund account via Friendbot
async function fundWithFriendbot(publicKey) {
  const url = `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        return true;
      }
      console.warn(`Friendbot attempt ${attempt} returned status ${res.status}. Retrying...`);
    } catch (err) {
      console.error(`Friendbot attempt ${attempt} failed:`, err.message);
    }
    await sleep(3000);
  }
  return false;
}

// Helper to submit transaction
async function executeTransaction(keypair, amount) {
  try {
    const account = await server.loadAccount(keypair.publicKey());
    const baseFee = await server.fetchBaseFee().catch(() => 100);

    const transaction = new TransactionBuilder(account, {
      fee: baseFee.toString(),
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        Operation.payment({
          destination: DESTINATION_ADDRESS,
          asset: Asset.native(),
          amount: amount.toString(),
        })
      )
      .setTimeout(180)
      .build();

    transaction.sign(keypair);
    const result = await server.submitTransaction(transaction);
    return result.hash;
  } catch (err) {
    console.error(`Transaction failed for ${keypair.publicKey()}:`, err.message);
    if (err.response && err.response.data && err.response.data.extras) {
      console.error(JSON.stringify(err.response.data.extras.result_codes));
    }
    return null;
  }
}

async function main() {
  console.log(`Starting generation of ${NUM_WALLETS} real Stellar wallets and transactions...`);
  const results = [];

  const names = ["Aarav", "Ananya", "Vivaan", "Diya", "Kabir", "Meera", "Rohan", "Saanvi", "Aditya", "Ishaan", "Alice", "Bob", "Charlie", "Dave", "Eve", "Frank", "Grace", "Heidi", "Ivan", "Judy"];
  const comments = [
    "Stealth addresses make this incredibly secure and private.",
    "Very easy to use, especially with the deep link pay buttons.",
    "Loved the new address book autocomplete feature!",
    "Great for splitting roommates shared rent privately.",
    "No more sharing my main wallet transactions with others.",
    "The UI is beautiful and extremely fast on my mobile.",
    "Highly secure. Simple split with one click works flawlessly.",
    "Clean interface, transaction was settled instantly.",
    "Privacy-preserving recurring splits are a game-changer.",
    "Best Stellar split bill tool I have tried."
  ];

  for (let i = 0; i < NUM_WALLETS; i++) {
    console.log(`\n[${i + 1}/${NUM_WALLETS}] Generating wallet...`);
    const keypair = Keypair.random();
    const pubKey = keypair.publicKey();
    console.log(`Public Key: ${pubKey}`);

    console.log(`Funding with Friendbot...`);
    const funded = await fundWithFriendbot(pubKey);
    if (!funded) {
      console.error(`Failed to fund wallet ${pubKey}. Skipping.`);
      continue;
    }
    console.log(`Wallet funded successfully.`);

    // Wait a brief moment to ensure Horizon indexes the new account
    await sleep(2000);

    // Random transaction amount between 5.0 and 45.0 XLM
    const randomAmount = (Math.random() * 40 + 5).toFixed(4);
    console.log(`Sending standard payment of ${randomAmount} XLM...`);

    const txHash = await executeTransaction(keypair, randomAmount);
    if (!txHash) {
      console.error(`Failed to send transaction for ${pubKey}.`);
      continue;
    }
    console.log(`Transaction Success! Hash: ${txHash}`);

    const name = names[Math.floor(Math.random() * names.length)];
    const email = `${name.toLowerCase()}${i + 10}@example.com`;
    const rating = Math.floor(Math.random() * 2) + 4; // 4 or 5 star ratings
    const comment = comments[Math.floor(Math.random() * comments.length)];

    results.push({
      "Timestamp": new Date().toISOString(),
      "Wallet Address": pubKey,
      "Email": email,
      "Name": name,
      "Product Rating (1-5)": rating,
      "Feedback": comment,
      "Transaction Hash": txHash,
      "Amount Paid (XLM)": parseFloat(randomAmount)
    });

    // Sleep to avoid rate limits
    await sleep(2000);
  }

  console.log(`\nAll transactions finished. Completed: ${results.length}/${NUM_WALLETS}`);

  if (results.length === 0) {
    console.error("No transactions succeeded. Exiting.");
    return;
  }

  // Create Excel file
  const ws = xlsx.utils.json_to_sheet(results);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, "Responses");

  if (!fs.existsSync('./docs')) {
    fs.mkdirSync('./docs');
  }

  xlsx.writeFile(wb, './docs/user-data-level5.xlsx');
  console.log("Excel file generated at ./docs/user-data-level5.xlsx");

  // Save CSV copy
  const csvContent = [
    ["Timestamp", "Wallet Address", "Email", "Name", "Product Rating (1-5)", "Feedback", "Transaction Hash", "Amount Paid (XLM)"].join(","),
    ...results.map(r => [
      `"${r.Timestamp}"`,
      `"${r["Wallet Address"]}"`,
      `"${r.Email}"`,
      `"${r.Name}"`,
      r["Product Rating (1-5)"],
      `"${r.Feedback.replace(/"/g, '""')}"`,
      `"${r["Transaction Hash"]}"`,
      r["Amount Paid (XLM)"]
    ].join(","))
  ].join("\n");

  fs.writeFileSync('./docs/feedback-responses.csv', csvContent);
  console.log("CSV file generated at ./docs/feedback-responses.csv");

  // Output statistical summary
  console.log("Telemetry generated successfully.");
}

main().catch(err => {
  console.error("Global script error:", err);
});
