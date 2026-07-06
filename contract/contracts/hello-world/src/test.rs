#![cfg(test)]

use super::*;
use soroban_sdk::{vec, Env, String, Address, contract, contractimpl};
use soroban_sdk::testutils::Address as _;

// A mock notifier contract to use for testing cross-contract calls
#[contract]
pub struct MockNotifier;

#[contractimpl]
impl MockNotifier {
    pub fn notify_completed(env: Env, bill_id: String, creator: Address) {
        let key = Symbol::new(&env, "completed");
        env.storage().persistent().set(&key, &true);
    }
    pub fn is_completed(env: Env, _bill_id: String) -> bool {
        false
    }
}

#[test]
fn test_create_split_success() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(SplitBillRegistry, ());
    let client = SplitBillRegistryClient::new(&env, &contract_id);

    let notifier_id = env.register(MockNotifier, ());

    let bill_id = String::from_str(&env, "bill-1");
    let total_amount = 1000;
    let creator = Address::generate(&env);
    let p1 = Address::generate(&env);
    let p2 = Address::generate(&env);
    let participants = vec![&env, p1.clone(), p2.clone()];

    client.create_split(&bill_id, &total_amount, &participants, &creator, &notifier_id);

    let status = client.get_split_status(&bill_id);
    assert_eq!(status.total_amount, total_amount);
    assert_eq!(status.creator, creator);
    assert_eq!(status.notifier, notifier_id);
    assert_eq!(status.cancelled, false);
    assert_eq!(status.participants.len(), 2);
}

#[test]
fn test_mark_paid_and_notifier_call() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(SplitBillRegistry, ());
    let client = SplitBillRegistryClient::new(&env, &contract_id);

    let notifier_id = env.register(MockNotifier, ());

    let bill_id = String::from_str(&env, "bill-2");
    let total_amount = 2000;
    let creator = Address::generate(&env);
    let p1 = Address::generate(&env);
    let participants = vec![&env, p1.clone()];

    client.create_split(&bill_id, &total_amount, &participants, &creator, &notifier_id);

    // Verify it is not completed yet in mock notifier
    let key = Symbol::new(&env, "completed");
    assert_eq!(env.as_contract(&notifier_id, || {
        env.storage().persistent().has(&key)
    }), false);

    // Mark p1 paid (which completes the bill because p1 is the only participant)
    client.mark_paid(&bill_id, &p1);

    let status = client.get_split_status(&bill_id);
    assert_eq!(status.participants.get(0).unwrap().paid, true);

    // Verify that the mock notifier was called
    assert_eq!(env.as_contract(&notifier_id, || {
        env.storage().persistent().has(&key)
    }), true);
}

#[test]
#[should_panic(expected = "HostError: Error(Auth, InvalidAction)")]
fn test_unauthorized_create_split() {
    let env = Env::default();
    // Do not call mock_all_auths() to simulate unauthorized access
    let contract_id = env.register(SplitBillRegistry, ());
    let client = SplitBillRegistryClient::new(&env, &contract_id);

    let notifier_id = Address::generate(&env);
    let bill_id = String::from_str(&env, "bill-3");
    let total_amount = 3000;
    let creator = Address::generate(&env);
    let p1 = Address::generate(&env);
    let participants = vec![&env, p1.clone()];

    // This should panic due to missing authorization for the creator
    client.create_split(&bill_id, &total_amount, &participants, &creator, &notifier_id);
}

#[test]
fn test_cancel_split_success() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(SplitBillRegistry, ());
    let client = SplitBillRegistryClient::new(&env, &contract_id);

    let notifier_id = Address::generate(&env);
    let bill_id = String::from_str(&env, "bill-4");
    let total_amount = 4000;
    let creator = Address::generate(&env);
    let p1 = Address::generate(&env);
    let participants = vec![&env, p1.clone()];

    client.create_split(&bill_id, &total_amount, &participants, &creator, &notifier_id);
    client.cancel_split(&bill_id);

    let status = client.get_split_status(&bill_id);
    assert_eq!(status.cancelled, true);
}

#[test]
fn test_add_participant_success() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(SplitBillRegistry, ());
    let client = SplitBillRegistryClient::new(&env, &contract_id);

    let notifier_id = Address::generate(&env);
    let bill_id = String::from_str(&env, "bill-5");
    let total_amount = 5000;
    let creator = Address::generate(&env);
    let p1 = Address::generate(&env);
    let participants = vec![&env, p1.clone()];

    client.create_split(&bill_id, &total_amount, &participants, &creator, &notifier_id);

    let p2 = Address::generate(&env);
    client.add_participant(&bill_id, &p2);

    let status = client.get_split_status(&bill_id);
    assert_eq!(status.participants.len(), 2);
    assert_eq!(status.participants.get(1).unwrap().address, p2);
}

#[test]
#[should_panic(expected = "HostError: Error(Auth, InvalidAction)")]
fn test_unauthorized_add_participant() {
    let env = Env::default();
    let contract_id = env.register(SplitBillRegistry, ());
    let client = SplitBillRegistryClient::new(&env, &contract_id);

    let bill_id = String::from_str(&env, "bill-6");
    let creator = Address::generate(&env);
    let p1 = Address::generate(&env);

    let bill = SplitBill {
        total_amount: 6000,
        participants: vec![&env, ParticipantStatus { address: p1, paid: false }],
        creator: creator.clone(),
        notifier: Address::generate(&env),
        cancelled: false,
    };

    // Write directly to contract storage in the test
    env.as_contract(&contract_id, || {
        let key = DataKey::Split(bill_id.clone());
        env.storage().persistent().set(&key, &bill);
    });

    // Call add_participant. Since mock_all_auths is not called, it should panic with auth failure
    let p2 = Address::generate(&env);
    client.add_participant(&bill_id, &p2);
}
