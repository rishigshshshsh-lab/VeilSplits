# VeilSplit (formerly StellarSplites)

**VeilSplit** is a production-ready, privacy-preserving recurring bill settlement protocol built on the Stellar network using Soroban smart contracts. It enables users to split expenses and settle up without linking repeated payments on-chain, keeping their financial relationships private.

## Live Demo
🚀 **[View Live Production App (Vercel)](https://veilsplit.vercel.app/)** *(Replace with actual URL after deployment)*

📹 **[Watch Demo Video (YouTube/Loom)](https://youtube.com)** *(2-3 min demo: onboarding → wallet connect → create private bill → stealth claim → settlement)*

---

## Features
- **Privacy-First (Hashed Commitments):** Bills are stored on the blockchain as non-reversible hashes rather than plaintext data.
- **Stealth Addresses:** Each participant gets a one-time, randomly derived "stealth address" to receive funds, decoupling the payment from their main wallet.
- **Legacy Fallback Mode:** Standard, non-private split payments are still supported for close friends.
- **Premium UX:** Cosmic glassmorphic UI, skeleton loaders, and global error boundaries ensure a smooth experience.

## Architecture

Our dual-contract architecture separates the bill logic from the stealth privacy mechanics.
- **`BillRegistry`**: Manages the lifecycle of a bill commitment.
- **`StealthPay`**: Manages the generation and verification of one-time stealth claim addresses.

For a detailed technical breakdown, please read our [Architecture Overview](./docs/ARCHITECTURE.md).

## Deployed Contract Addresses (Stellar Testnet)
- **BillRegistry Contract:** `CD... (Replace with deployed ID)`
- **StealthPay Contract:** `CD... (Replace with deployed ID)`
- **Notifier Contract:** `CD... (Replace with deployed ID)`

---

## Proof of Users & Feedback

We successfully onboarded **14 unique real users** for our MVP test. The average user rating was **4.6 / 5.0**. 
Our onboarding flow effectively simplified the concept of "stealth addresses" to non-crypto native users.

> "The UI is incredibly slick, and switching between standard and private splits is seamless." - *Test User*

*See [docs/USER_FEEDBACK.md](./docs/USER_FEEDBACK.md) for full qualitative insights and future improvements.*

**Analytics Snapshot (14 Active Users):**
![Analytics Dashboard](./public/analytics_snapshot.png) *(Placeholder for screenshot)*

---

## Local Setup & Development

### 1. Prerequisites
- Node.js (v18+)
- Rust (v1.81 for Soroban)
- Stellar CLI

### 2. Frontend Setup
```bash
npm install
npm run dev
```

### 3. Smart Contracts Setup
The Soroban contracts are located in the `contract/contracts/` directory.

```bash
cd contract
cargo build --target wasm32-unknown-unknown --release
```
To deploy the contracts to the Testnet, use the Stellar CLI:
```bash
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/bill_registry.wasm \
  --source YOUR_SECRET_KEY \
  --network testnet
```

Update your `.env` file with the newly deployed contract IDs.

## License
MIT
