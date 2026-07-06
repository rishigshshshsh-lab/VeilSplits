#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Symbol, Address, Env, String, Vec};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ParticipantStatus {
    pub address: Address,
    pub paid: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SplitBill {
    pub total_amount: u64,
    pub participants: Vec<ParticipantStatus>,
    pub creator: Address,
    pub notifier: Address,
    pub cancelled: bool,
}

#[contracttype]
pub enum DataKey {
    Split(String),
}

#[soroban_sdk::contractclient(name = "SplitNotifierClient")]
pub trait SplitNotifierInterface {
    fn notify_completed(env: Env, bill_id: String, creator: Address);
    fn is_completed(env: Env, bill_id: String) -> bool;
}

#[contract]
pub struct SplitBillRegistry;

#[contractimpl]
impl SplitBillRegistry {
    pub fn create_split(
        env: Env,
        bill_id: String,
        total_amount: u64,
        participants: Vec<Address>,
        creator: Address,
        notifier: Address,
    ) {
        creator.require_auth();

        let key = DataKey::Split(bill_id.clone());
        if env.storage().persistent().has(&key) {
            panic!("Split bill already exists");
        }

        let mut participant_statuses = Vec::new(&env);
        for p in participants.iter() {
            participant_statuses.push_back(ParticipantStatus {
                address: p,
                paid: false,
            });
        }

        let bill = SplitBill {
            total_amount,
            participants: participant_statuses,
            creator: creator.clone(),
            notifier,
            cancelled: false,
        };

        env.storage().persistent().set(&key, &bill);

        // Emit split_created event
        env.events().publish(
            (Symbol::new(&env, "split_created"), bill_id),
            (creator, total_amount),
        );
    }

    pub fn mark_paid(env: Env, bill_id: String, participant_address: Address) {
        let key = DataKey::Split(bill_id.clone());
        let mut bill: SplitBill = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| panic!("Split bill does not exist"));

        if bill.cancelled {
            panic!("Split bill is cancelled");
        }

        // Require auth of the creator of the bill
        bill.creator.require_auth();

        let mut found = false;
        let mut updated_participants = Vec::new(&env);

        for p in bill.participants.iter() {
            let mut p_status = p.clone();
            if p_status.address == participant_address {
                p_status.paid = true;
                found = true;
            }
            updated_participants.push_back(p_status);
        }

        if !found {
            panic!("Participant address not found in split bill");
        }

        bill.participants = updated_participants;
        env.storage().persistent().set(&key, &bill);

        // Emit payment_marked event
        env.events().publish(
            (Symbol::new(&env, "payment_marked"), bill_id.clone()),
            participant_address.clone(),
        );

        // Check if all paid
        let mut all_paid = true;
        for p in bill.participants.iter() {
            if !p.paid {
                all_paid = false;
                break;
            }
        }

        if all_paid {
            let notifier_client = SplitNotifierClient::new(&env, &bill.notifier);
            notifier_client.notify_completed(&bill_id, &bill.creator);
        }
    }

    pub fn cancel_split(env: Env, bill_id: String) {
        let key = DataKey::Split(bill_id.clone());
        let mut bill: SplitBill = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| panic!("Split bill does not exist"));

        // Require creator authority to cancel
        bill.creator.require_auth();

        if bill.cancelled {
            panic!("Split bill is already cancelled");
        }

        bill.cancelled = true;
        env.storage().persistent().set(&key, &bill);

        // Emit split_cancelled event
        env.events().publish(
            (Symbol::new(&env, "split_cancelled"), bill_id),
            (),
        );
    }

    pub fn add_participant(env: Env, bill_id: String, participant: Address) {
        let key = DataKey::Split(bill_id.clone());
        let mut bill: SplitBill = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| panic!("Split bill does not exist"));

        if bill.cancelled {
            panic!("Split bill is cancelled");
        }

        // Require creator authority to add a participant
        bill.creator.require_auth();

        let mut exists = false;
        for p in bill.participants.iter() {
            if p.address == participant {
                exists = true;
                break;
            }
        }
        if exists {
            panic!("Participant already exists");
        }

        bill.participants.push_back(ParticipantStatus {
            address: participant.clone(),
            paid: false,
        });

        env.storage().persistent().set(&key, &bill);

        // Emit participant_added event
        env.events().publish(
            (Symbol::new(&env, "participant_added"), bill_id),
            participant,
        );
    }

    pub fn get_split_status(env: Env, bill_id: String) -> SplitBill {
        let key = DataKey::Split(bill_id);
        env.storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| panic!("Split bill does not exist"))
    }
}

mod test;
