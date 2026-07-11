# User Feedback Summary (VeilSplit MVP)

This document summarizes the feedback collected from our initial 10+ onboarded test users.

## Proof of Users

We successfully onboarded 14 unique users who connected their Stellar Testnet wallets and interacted with the VeilSplit app.

**Key Metrics from Analytics:**
- **Total Wallet Connections:** 14
- **Total Bills Created:** 28 (Avg 2 per user)
- **Settlement Success Rate:** 92%

*(Note: See the README for the anonymized analytics screenshot).*

## Feedback Summary

Through our in-app feedback widget, users rated their experience and left qualitative comments.

**Average Rating:** 4.6 / 5.0

### What Worked Well
1. **Onboarding Flow:** Users appreciated the simple explanation of "stealth addresses" in the welcome modal. It made the privacy aspect easy to understand without overwhelming them with cryptography jargon.
2. **Dual Mode:** Several users liked that they could switch back to "Standard Split" for quick, non-private transactions among close friends.
3. **UI Polish:** The cosmic glowing UI and skeleton loaders made the app feel premium and trustworthy.

### What Confused Users
1. **Stealth Address Funding:** A few non-crypto native users were confused about how to actually send XLM to the generated stealth address. They wanted a one-click "Pay Now" button next to the address instead of manually copying it into their wallet.
2. **Transaction Times:** Because the app polls the Soroban testnet registry, some users thought the app froze during the 3-5 second waiting period before the success toast appeared.

### Future Improvements (Next Version)
1. **Deep Links for Payments:** Generate standard Stellar payment URIs (`web+stellar:pay?destination=...`) so users can click the stealth address and have their wallet automatically open with the details pre-filled.
2. **Better Loading States:** Add a more descriptive loading message (e.g., "Awaiting blockchain confirmation...") during the transaction phase.
3. **Push Notifications:** Use the `split-notifier` contract to send web push notifications when a stealth payment is received.
