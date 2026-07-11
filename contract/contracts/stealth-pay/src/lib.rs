#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, BytesN, Bytes, Env};

#[contracttype]
pub enum DataKey {
    Claim(BytesN<32>), // Stealth address -> is_claimed (bool)
}

#[contract]
pub struct StealthPayContract;

#[contractimpl]
impl StealthPayContract {
    /// Derives a one-time-use payment address (represented as a 32-byte hash)
    /// for a participant in a specific bill.
    pub fn generate_claim_address(env: Env, bill_id: BytesN<32>, participant: Address) -> BytesN<32> {
        // Create a unique payload: bill_id + participant address
        let mut payload = Bytes::new(&env);
        payload.extend_from_array(&bill_id.to_array());
        
        // Convert address to bytes and append (for MVP we just use the string representation bytes)
        let participant_str = participant.to_string();
        let participant_bytes = participant_str.as_bytes();
        // Since as_bytes() returns soroban_sdk::Bytes, we can just append it
        payload.append(&participant_bytes);
        
        let stealth_address = env.crypto().sha256(&payload);
        
        // Initialize claim status to false (unclaimed)
        env.storage().persistent().set(&DataKey::Claim(stealth_address.clone()), &false);
        
        stealth_address
    }

    /// Verifies and marks a payment as claimed via the stealth address.
    pub fn verify_claim(env: Env, stealth_address: BytesN<32>) -> bool {
        let key = DataKey::Claim(stealth_address.clone());
        if let Some(is_claimed) = env.storage().persistent().get::<_, bool>(&key) {
            if !is_claimed {
                env.storage().persistent().set(&key, &true);
                return true;
            }
        }
        false
    }
}
