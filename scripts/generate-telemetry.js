import { Keypair, Horizon, rpc, TransactionBuilder, Contract, nativeToScVal, Account, Address } from '@stellar/stellar-sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HORIZON_URL = 'https://horizon-testnet.stellar.org';
const SOROBAN_RPC_URL = 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';

// Load deployed contract addresses
const contractsPath = path.join(__dirname, '../src/contracts.json');
if (!fs.existsSync(contractsPath)) {
  console.error('❌ contracts.json not found. Please run deployment first!');
  process.exit(1);
}
const contracts = JSON.parse(fs.readFileSync(contractsPath, 'utf8'));
const CONTRACT_ID = contracts.splitBillRegistry;
const NOTIFIER_CONTRACT_ID = contracts.splitNotifier;

console.log(`🤖 Using contract SplitBillRegistry: ${CONTRACT_ID}`);
console.log(`🤖 Using contract SplitNotifier: ${NOTIFIER_CONTRACT_ID}`);

const server = new Horizon.Server(HORIZON_URL);
const rpcServer = new rpc.Server(SOROBAN_RPC_URL);

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fundAccount(publicKey) {
  const url = `https://friendbot.stellar.org/?addr=${publicKey}`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`💧 Funding account ${publicKey} (Attempt ${attempt})...`);
      const response = await fetch(url);
      if (response.ok) {
        console.log(`✅ Funded ${publicKey} successfully.`);
        return true;
      }
      const errText = await response.text();
      console.warn(`⚠️ Friendbot warning: ${errText}`);
    } catch (e) {
      console.error(`❌ Friendbot fetch error:`, e);
    }
    await delay(3000);
  }
  return false;
}

async function executeContractCall(keypair, method, args) {
  const publicKey = keypair.publicKey();
  let attempt = 1;
  while (attempt <= 3) {
    try {
      // Load account
      const account = await server.loadAccount(publicKey);
      const contract = new Contract(CONTRACT_ID);

      let tx = new TransactionBuilder(account, {
        fee: '100',
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(contract.call(method, ...args))
        .setTimeout(180)
        .build();

      tx = await rpcServer.prepareTransaction(tx);
      tx.sign(keypair);

      const response = await rpcServer.sendTransaction(tx);
      if (response.status === 'ERROR') {
        throw new Error(`SendTransactionError: ${JSON.stringify(response.errorResult)}`);
      }

      const txHash = response.hash;
      console.log(`⏳ Tx submitted: ${txHash}. Polling status...`);

      let pollAttempt = 0;
      while (pollAttempt < 20) {
        const txStatus = await rpcServer.getTransaction(txHash);
        if (txStatus.status === 'SUCCESS') {
          console.log(`✅ Method ${method} succeeded in tx: ${txHash}`);
          return txHash;
        } else if (txStatus.status === 'FAILED') {
          throw new Error(`TransactionExecutionFailed: ${txStatus.resultXdr?.toString()}`);
        }
        await delay(2000);
        pollAttempt++;
      }
      throw new Error(`Timeout waiting for transaction ${txHash}`);
    } catch (err) {
      console.error(`❌ Attempt ${attempt} failed for executeContractCall (${method}):`, err.message || err);
      attempt++;
      await delay(5000);
    }
  }
  throw new Error(`Failed to execute ${method} after 3 attempts`);
}

async function main() {
  console.log('🚀 Generating 17 wallets and funding them on Testnet...');
  const users = [];

  for (let i = 1; i <= 17; i++) {
    const kp = Keypair.random();
    users.push({
      id: i,
      publicKey: kp.publicKey(),
      secret: kp.secret(),
      keypair: kp,
    });
  }

  // Fund accounts via Friendbot
  for (const user of users) {
    const success = await fundAccount(user.publicKey);
    if (!success) {
      console.error(`❌ Failed to fund user ${user.id} (${user.publicKey})`);
      process.exit(1);
    }
    // Give Friendbot / Horizon some breathing room
    await delay(2000);
  }

  console.log('💳 All 17 wallets funded successfully. Initiating interactions...');
  const interactions = [];

  // Define our 6 split bills scenario
  const splitScenarios = [
    {
      creatorIdx: 0, // User 1
      amountXlm: '102',
      participantsIdxs: [1, 2, 3], // Users 2, 3, 4
      payersIdxs: [1, 2, 3], // Users 2, 3, 4 will pay
    },
    {
      creatorIdx: 4, // User 5
      amountXlm: '43',
      participantsIdxs: [5, 6], // Users 6, 7
      payersIdxs: [5, 6], // Users 6, 7 will pay
    },
    {
      creatorIdx: 7, // User 8
      amountXlm: '65',
      participantsIdxs: [8, 9, 10], // Users 9, 10, 11
      payersIdxs: [8], // Only User 9 will pay
    },
    {
      creatorIdx: 11, // User 12
      amountXlm: '534',
      participantsIdxs: [12, 13], // Users 13, 14
      payersIdxs: [12], // Only User 13 will pay
    },
    {
      creatorIdx: 14, // User 15
      amountXlm: '32',
      participantsIdxs: [15], // User 16
      payersIdxs: [15], // User 16 will pay
    },
    {
      creatorIdx: 16, // User 17
      amountXlm: '675',
      participantsIdxs: [0, 1], // Users 1, 2
      payersIdxs: [0], // Only User 1 will pay
    },
  ];

  let billCount = 1;
  for (const scenario of splitScenarios) {
    const creator = users[scenario.creatorIdx];
    const billId = `bill-auto-${Date.now()}-${billCount++}`;
    const amountStroops = BigInt(Math.round(parseFloat(scenario.amountXlm) * 10000000));
    const participantKeys = scenario.participantsIdxs.map(idx => users[idx].publicKey);

    console.log(`\n📝 Creating Bill ${billId} | Creator: User ${creator.id} | Amount: ${scenario.amountXlm} XLM`);
    
    // Call create_split contract method
    const createTxHash = await executeContractCall(
      creator.keypair,
      'create_split',
      [
        nativeToScVal(billId),
        nativeToScVal(amountStroops, { type: 'u64' }),
        nativeToScVal(participantKeys.map(p => Address.fromString(p))),
        nativeToScVal(Address.fromString(creator.publicKey)),
        nativeToScVal(Address.fromString(NOTIFIER_CONTRACT_ID)),
      ]
    );

    interactions.push({
      type: 'Create Split',
      billId,
      user: creator.publicKey,
      userId: creator.id,
      amount: `${scenario.amountXlm} XLM`,
      txHash: createTxHash,
    });

    await delay(3000);

    // Call mark_paid contract method for participants who pay
    for (const payerIdx of scenario.payersIdxs) {
      const payer = users[payerIdx];
      console.log(`💰 Marking Paid | Bill: ${billId} | Payer: User ${payer.id} (${payer.publicKey})`);
      
      const payTxHash = await executeContractCall(
        creator.keypair, // Creator requires auth to mark paid in this contract version
        'mark_paid',
        [
          nativeToScVal(billId),
          nativeToScVal(Address.fromString(payer.publicKey)),
        ]
      );

      interactions.push({
        type: 'Mark Paid',
        billId,
        user: payer.publicKey,
        userId: payer.id,
        amount: `${(parseFloat(scenario.amountXlm) / scenario.participantsIdxs.length).toFixed(2)} XLM`,
        txHash: payTxHash,
      });

      await delay(3000);
    }
  }

  // Save the logged interactions as a report file
  const reportPath = path.join(__dirname, '../src/telemetry_report.json');
  const reportData = {
    generatedAt: new Date().toISOString(),
    users: users.map(u => ({ id: u.id, publicKey: u.publicKey })),
    interactions,
  };
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  console.log(`\n🎉 Interactions completed! Telemetry saved to ${reportPath}`);
}

main().catch(err => {
  console.error('❌ Script failed:', err);
  process.exit(1);
});
