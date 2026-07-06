import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting Soroban contract deployment process...');

try {
  // 1. Build contracts
  console.log('📦 Building contracts...');
  execSync('stellar contract build', { cwd: path.join(__dirname, '../contract'), stdio: 'inherit' });

  // 2. Deploy Split Notifier
  console.log('📡 Deploying Split Notifier...');
  const notifierIdBytes = execSync(
    'stellar contract deploy --wasm contract/target/wasm32v1-none/release/split_notifier.wasm --source default --network testnet',
    { cwd: path.join(__dirname, '..') }
  );
  const notifierId = notifierIdBytes.toString().trim();
  console.log(`✅ Split Notifier deployed. Contract ID: ${notifierId}`);

  // 3. Deploy Split Bill Registry
  console.log('📡 Deploying Split Bill Registry...');
  const registryIdBytes = execSync(
    'stellar contract deploy --wasm contract/target/wasm32v1-none/release/split_bill_registry.wasm --source default --network testnet',
    { cwd: path.join(__dirname, '..') }
  );
  const registryId = registryIdBytes.toString().trim();
  console.log(`✅ Split Bill Registry deployed. Contract ID: ${registryId}`);

  // 4. Save to contracts.json
  const configPath = path.join(__dirname, '../src/contracts.json');
  const config = {
    splitBillRegistry: registryId,
    splitNotifier: notifierId,
  };
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(`📝 Saved contract addresses to ${configPath}`);

  console.log('🎉 Deployment workflow completed successfully!');
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}
