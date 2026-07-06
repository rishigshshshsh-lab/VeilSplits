# Split Bill Calculator - Stellar Testnet dApp

A beautiful, high-performance decentralized web application (dApp) built on the Stellar Testnet. This tool allows users to connect their Freighter wallet, load their live XLM balance, configure an expense/bill, dynamically add recipients, automatically compute equal split shares (rounded to 7 decimal places of Stellar precision), and sequentially execute and submit transactions via Freighter to the Horizon Testnet API.

## Features

- **Wallet Setup & Presence Checking**: Detects if the Freighter extension is installed and warns the user if it's missing, providing direct links to download it.
- **Secure Wallet Connection**: Authenticates via Freighter to fetch the user's public address and securely save the connection state (cleared on Disconnect).
- **Live Testnet Balance Monitoring**: Queries the official Stellar Horizon Testnet server in real time to fetch and show the XLM balance, displaying loading states and custom warnings for unfunded accounts.
- **Dynamic Split Calculations**: Auto-calculates split amounts down to 7 decimal places based on total bill and participants. Includes a custom option to exclude or include the sender's own share from payments.
- **Sequential Transaction Pipeline**: Automatically builds and processes individual payments sequentially. Triggers Freighter to prompt signature for each payment, submitting them to the Testnet network.
- **Real-Time Transaction Logging**: Displays individual transaction statuses (Pending, Success with Stellar.expert explorer links, or Failed with human-readable error reasons) and compiles a final success/failure summary.

## Tech Stack Used

- **Framework**: React 19 (via Vite)
- **Language**: TypeScript
- **Styling**: Vanilla CSS (Custom Design System with Cosmic Gradients, Backdrop Blurs, and Micro-Animations)
- **Stellar Libraries**:
  - `@stellar/stellar-sdk` (v13.3.0/v13+) for building transactions and Horizon interaction
  - `@stellar/freighter-api` (v6.0.1) for Freighter extension communication
- **Icons**: `lucide-react`

## Setup Instructions

### 1. Clone the Repository
```bash
git clone <repository-url>
cd StellarSplit
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
Open your browser and navigate to the address displayed (usually `http://localhost:5173`).

### 4. Install & Configure Freighter Wallet
1. Download and install the Freighter browser extension from [freighter.app](https://www.freighter.app/).
2. Create or import a wallet account.
3. Open Freighter settings, go to **Network**, and switch the active network to **Testnet** (Default Testnet passphrase: `Test SDF Network ; September 2015`).

### 5. Fund Your Testnet Account
New Stellar Testnet accounts must be funded before they can hold balances or execute transactions.
1. Copy your public address from Freighter.
2. Go to the [Stellar Laboratory Friendbot](https://laboratory.stellar.org/#friendbot).
3. Paste your public address in the text field and click **Get Test Network Lumens**.
4. Refresh your balance inside the Split Bill dApp.

## Screenshots & Explorer Transactions

Here are the visual representations of the application flow and live Stellar Testnet transactions:

1. **Wallet Connected State**
   ![Wallet Connected State](./image.png)

2. **Balance Displayed**
   ![Balance Displayed](./image-1.png)

3. **Successful Testnet Transaction**
   ![Successful Testnet Transaction](./image-3.png)

4. **Transaction Result Shown to User**
   ![Transaction Result Shown to User](./image-2.png)

5. **Live Stellar Testnet Transactions on Stellar.expert**
   - **Transaction 1**: [c11c8400...acd84c](https://stellar.expert/explorer/testnet/tx/c11c8400251c22e71db69071924186e99aa30b7843a4c1e92994c5a367acd84c)
   - **Transaction 2**: [d714ea3e...0e8fa](https://stellar.expert/explorer/testnet/tx/d714ea3ed3a8b1b1ae8ca1bb68e75e7b5970c09d5aca615745bf37159c08e8fa)
## How to Use

1. **Connect Wallet**: Click the **Connect Wallet** button in the header. Authorize the Freighter popup connection request.
2. **Review Balance**: Verify your XLM balance is loaded. If it's your first time, follow the link to fund your account via Friendbot.
3. **Fill Out Bill Details**: 
   - Input the **Total Bill Amount (XLM)**.
   - Input the **Number of People** to split the bill with.
   - Choose whether to include yourself in the split (if checked, your share is kept, and the rest is distributed to the other recipients).
4. **Enter Recipients**: Fill in the Stellar public key addresses (beginning with `G...`) for each recipient. If you unchecked the include-yourself option, input all recipient addresses manually.
5. **Review Summary**: Inspect the automatically calculated payment breakdown and verify that your wallet has enough funds to cover the transaction costs.
6. **Send Split Payments**: Click **Send Split Payments**. Your browser will open Freighter popup prompts sequentially for each transaction. Confirm each signature request.
7. **View Results**: Watch the live status log update. Once finished, review the final transaction log and check the explorer links for verification on the ledger.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
