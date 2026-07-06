#![cfg(test)]

use super::*;
use soroban_sdk::{Env, String, Address, testutils::Address as _};

#[test]
fn test_notify_completed() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(SplitNotifier, ());
    let client = SplitNotifierClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let bill_id = String::from_str(&env, "bill-123");
    assert_eq!(client.is_completed(&bill_id), false);

    client.notify_completed(&bill_id, &creator);
    assert_eq!(client.is_completed(&bill_id), true);
}
