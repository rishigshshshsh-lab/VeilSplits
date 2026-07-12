# VeilSplit Pitch Deck Content
This document contains the complete content, slide layouts, and speaker notes for the **VeilSplit** pitch deck. You can copy and paste this directly into Google Slides or PowerPoint.

---

## Slide 1: Title Slide
* **Slide Title:** VeilSplit
* **Subtitle:** Privacy-First Bill Splitting on Stellar
* **Bullet Content:**
  * Built by `[YOUR NAME]`
  * Stellar Journey to Mastery — Level 5 Submission
  * Smart Contract Registry + Stealth Payouts
  * Live Demo: [veil-splits.vercel.app](https://veil-splits.vercel.app/)
* **Speaker Notes:**
  > "Hello everyone, my name is `[YOUR NAME]`, and today I am excited to present VeilSplit—a privacy-preserving, recurring bill settlement protocol built on Stellar. With VeilSplit, we are resolving a fundamental issue of public blockchain transparency for everyday social finance, making group expense splitting private, secure, and user-friendly on the Soroban network."

---

## Slide 2: Problem Statement
* **Slide Title:** The Web3 Social Privacy Paradox
* **Bullet Content:**
  * **Exposed History:** Public ledgers expose every transaction amount, wallet address, and repeated payment pattern.
  * **Social Mapping:** Obsessive on-chain observers can map real-world relationships and net worth.
  * **Friction and Inertia:** Lack of privacy deters mainstream users from using Web3 for everyday household expenses.
  * **Static Workflows:** Current tools do not support automated, private routing for recurring liabilities.
* **Speaker Notes:**
  > "In Web3 today, splitting group expenses is a privacy nightmare. Every transaction leaves a permanent, public trail linking the wallet addresses of roommates, friends, or coworkers. Over time, anyone can reconstruct your entire social network and financial standings. This lack of privacy, combined with a lack of tools for recurring bills, blocks mainstream adoption of crypto for everyday financial coordination."

---

## Slide 3: Solution
* **Slide Title:** Settle Bills with Total Privacy
* **Bullet Content:**
  * **Hashed Commitments:** Smart contracts store only one-way cryptographic hashes of bill data.
  * **Stealth Claim Addresses:** Deterministic, one-time payment endpoints generated for each participant.
  * **Linkability Broken:** Observers cannot link a participant's main account to their claim transaction.
  * **Non-Custodial & Automated:** Built directly on Soroban, securing funds without intermediaries.
* **Speaker Notes:**
  > "VeilSplit solves this privacy gap through two core mechanisms. First, we store bill commitments on-chain as cryptographic hashes instead of plaintext details. Second, we generate randomized, one-time stealth claim addresses for each participant. This decouples payments from main public keys, allowing users to settle bills without exposing their transaction history or financial relationships."

---

## Slide 4: Market Opportunity
* **Slide Title:** Private Expense Management for Everyone
* **Bullet Content:**
  * **Roommates & Households:** Private rent, utility splits, and shared grocery logs.
  * **Freelancer Collectives:** Decoupling operational expenses from individual wallets.
  * **DAOs & Communities:** Paying contributors and splitting payouts without disclosing identities.
  * **Privacy Premium:** Tapping into a growing demand for data privacy in decentralized social finance.
* **Speaker Notes:**
  > "Our target market spans peer-to-peer social circles like roommates, freelancer collectives who split shared operations costs, and DAOs paying contributors. Financial privacy is a fundamental human right. As Web3 goes mainstream, users expect the same transaction confidentiality they receive from traditional banking apps, making VeilSplit a crucial piece of financial infrastructure."

---

## Slide 5: Product Demo Highlights
* **Slide Title:** Premium and Frictionless UX
* **Bullet Content:**
  * **2-Minute Onboarding:** Quick connection via Freighter Wallet with interactive tutorials.
  * **Equal Split Calculator:** Instant calculation of split amounts with a localized Address Book.
  * **Deep Payment Links:** One-click "Pay Now" Stellar URI links for stealth addresses.
  * *[PLACEHOLDER: Insert Screenshot of Dashboard]*
  * *[PLACEHOLDER: Insert Screenshot of Stealth Payout Screen]*
* **Speaker Notes:**
  > "We built VeilSplit with a premium, sleek dark-themed frontend using vanilla CSS to captivate users. The product features an onboarded user flow under 2 minutes, a quick split calculator, a local address book, and deep payment links. This simplifies claiming and paying bills down to a single click, completely hiding the complex cryptographic heavy lifting from the end user."

---

## Slide 6: Architecture Overview
* **Slide Title:** How VeilSplit Works Under the Hood
* **Bullet Content:**
  * **Frontend (React/TS):** Handles user interactions, local inputs, and wallet signatures.
  * **BillRegistry Contract:** Registers hashed commitments and maps bills to stealth addresses.
  * **StealthPay Contract:** Uses deterministic derivation to generate and verify one-time claim endpoints.
  * **Notifier Contract:** Alerts participants once bills are settled without exposing transaction history.
* **Speaker Notes:**
  > "Under the hood, VeilSplit's frontend communicates with two core Soroban smart contracts on the Stellar Testnet: BillRegistry and StealthPay. When a bill is created, the BillRegistry contract registers the hashed commitment and calls StealthPay to generate unique claim endpoints. Once the payment is verified at the stealth address, the registry status is updated to paid, notifying the sender without leaking any linkable addresses on the ledger."

---

## Slide 7: Traction & Growth So Far
* **Slide Title:** Validation & User Feedback
* **Bullet Content:**
  * **67 Active Testnet Wallets:** Successfully onboarded during Level 5 testing.
  * **67 Verifiable Transactions:** 100% telemetry validation of on-chain activity.
  * **Direct Feedback Loop:** Integrated with Google Forms for user-driven iterations.
  * **Rapid Iteration:** Shipped user-suggested features (Light/Dark mode, copy shortcuts, and hotkeys).
* **Speaker Notes:**
  > "For our Level 5 milestone, we organically onboarded 67 unique active wallets to test our contracts on the Stellar Testnet. Every single user interaction has been verified with transaction hashes on-chain. We also set up a direct feedback loop via Google Forms and have already implemented 8 direct feature suggestions from our users, including copy-shortcuts, hotkeys, and skeleton loading states."

---

## Slide 8: Growth Strategy
* **Slide Title:** Scaling to the Next Level
* **Bullet Content:**
  * **Developer Communities:** Outreach in the Stellar Discord and Reddit crypto forums.
  * **dApp Integrations:** Providing open APIs for other Stellar projects to plug in private splitting.
  * **Anchor Integration:** Utilizing Stellar Anchors (SEP-24) to enable fiat-to-token on-ramping.
  * **Referral Loops:** Multi-user incentive splits to reward users who onboard roommates and teams.
* **Speaker Notes:**
  > "To acquire our initial user base, we distributed the project across targeted crypto-native channels, including the Stellar Discord and r/Stellar on Reddit. Moving forward, we plan to drive growth by partnering with Web3 contributor platforms. Furthermore, by integrating Stellar Anchors, we want to allow users to pay bills with fiat currency that directly swaps into stealth XLM addresses, removing the friction of buying crypto."

---

## Slide 9: Roadmap
* **Slide Title:** Next Phases & Mainnet Readiness
* **Bullet Content:**
  * **Level 6 (Gold Belt):** Escrow contracts for disputes and multi-signature arbitration.
  * **Level 7 (Mastery):** Reputation scoring, smart contract audits, and Mainnet deployment.
  * **Future Vision:** A privacy infrastructure layer that any Stellar application can plug into for private settlements.
* **Speaker Notes:**
  > "Our roadmap is structured for security and scalability. For Level 6, we are introducing escrow-based dispute resolution and multisig arbitration. For Level 7, we'll implement reputation scores and get audited for Mainnet. Ultimately, our vision is to package this technology as a developer SDK, allowing any dApp on Stellar to easily plug in private, stealth-address settlements."

---

## Slide 10: Closing & Ask
* **Slide Title:** Join the Financial Privacy Movement
* **Bullet Content:**
  * **Founder:** `[YOUR NAME]` — Passionate developer in the Stellar ecosystem.
  * **The Ask:** Open feedback from developers, and potential pilot partners for DAO/freelancer collectives.
  * **Learn More:** [veil-splits.vercel.app](https://veil-splits.vercel.app/)
  * **Contact:** `[YOUR EMAIL / SOCIAL LINK]`
* **Speaker Notes:**
  > "VeilSplit is built to bring real-world utility and privacy to daily Web3 social payments. I am currently seeking feedback from the community, developers, and partners to refine our smart contracts and integration points. Thank you for your time, and please visit the live demo and dashboard on the Stellar Testnet!"
