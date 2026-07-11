#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, BytesN, Env, Vec};
use stealth_pay::StealthPayContractClient;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BillCommitment {
    pub creator: Address,
    pub total_amount_hash: BytesN<32>,
    pub is_settled: bool,
    pub participant_stealth_addresses: Vec<BytesN<32>>,
}

#[contracttype]
pub enum DataKey {
    Bill(BytesN<32>), // bill_id -> BillCommitment
}

#[contract]
pub struct BillRegistryContract;

#[contractimpl]
impl BillRegistryContract {
    /// Creates a new bill with hashed commitments for privacy.
    /// Calls the StealthPay contract to generate one-time claim addresses for each participant.
    pub fn create_bill(
        env: Env,
        bill_id: BytesN<32>,
        creator: Address,
        total_amount_hash: BytesN<32>,
        participants: Vec<Address>,
        stealth_pay_contract_id: Address,
    ) {
        creator.require_auth();

        let stealth_client = StealthPayContractClient::new(&env, &stealth_pay_contract_id);
        let mut stealth_addresses = Vec::new(&env);

        for participant in participants.iter() {
            let stealth_address = stealth_client.generate_claim_address(&bill_id, &participant);
            stealth_addresses.push_back(stealth_address);
        }

        let commitment = BillCommitment {
            creator,
            total_amount_hash,
            is_settled: false,
            participant_stealth_addresses: stealth_addresses,
        };

        env.storage().persistent().set(&DataKey::Bill(bill_id.clone()), &commitment);
    }

    /// Marks a bill as fully settled.
    pub fn mark_settled(env: Env, bill_id: BytesN<32>) {
        let key = DataKey::Bill(bill_id.clone());
        if let Some(mut commitment) = env.storage().persistent().get::<_, BillCommitment>(&key) {
            commitment.creator.require_auth();
            commitment.is_settled = true;
            env.storage().persistent().set(&key, &commitment);
        } else {
            panic!("Bill not found");
        }
    }

    /// Returns the current status of the bill.
    pub fn get_bill_status(env: Env, bill_id: BytesN<32>) -> Option<BillCommitment> {
        let key = DataKey::Bill(bill_id);
        env.storage().persistent().get::<_, BillCommitment>(&key)
    }
}
