#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Symbol, Env, String, Address};

#[contracttype]
pub enum DataKey {
    Completed(String),
}

#[contract]
pub struct SplitNotifier;

#[contractimpl]
impl SplitNotifier {
    pub fn notify_completed(env: Env, bill_id: String, creator: Address) {
        creator.require_auth();
        let key = DataKey::Completed(bill_id.clone());
        env.storage().persistent().set(&key, &true);

        // Emit notify_completed event
        env.events().publish(
            (Symbol::new(&env, "notify_completed"), bill_id),
            (),
        );
    }

    pub fn is_completed(env: Env, bill_id: String) -> bool {
        let key = DataKey::Completed(bill_id);
        env.storage().persistent().get(&key).unwrap_or(false)
    }
}

mod test;
