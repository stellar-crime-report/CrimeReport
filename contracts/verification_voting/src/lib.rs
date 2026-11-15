#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, Address, Env, String,
    Symbol, Vec,
};

const DEFAULT_THRESHOLD: u32 = 3;
const EVENT_REPORT_VERIFIED: Symbol = symbol_short!("verified");

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum VotingError {
    AlreadyInitialized = 1,
    InvalidThreshold = 2,
    AlreadyVoted = 3,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VoteTally {
    pub genuine: u32,
    pub fake: u32,
    pub voters: Vec<Address>,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ReportVerifiedEvent {
    pub report_id: String,
    pub genuine_votes: u32,
    pub threshold: u32,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Threshold,
    Votes(String),
    Verified(String),
}

#[contract]
pub struct VerificationVotingContract;

#[contractimpl]
impl VerificationVotingContract {
    /// Optional initializer to configure an admin address and custom verification threshold.
    /// If not called, the contract defaults to `DEFAULT_THRESHOLD` (3 genuine votes).
    pub fn initialize(env: Env, admin: Address, threshold: u32) -> Result<(), VotingError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(VotingError::AlreadyInitialized);
        }
        if threshold == 0 {
            return Err(VotingError::InvalidThreshold);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::Threshold, &threshold);
        Ok(())
    }

    /// Updates the genuine-vote threshold required to mark a report as verified.
    pub fn set_threshold(env: Env, threshold: u32) -> Result<(), VotingError> {
        if threshold == 0 {
            return Err(VotingError::InvalidThreshold);
        }
        if let Some(admin) = env
            .storage()
            .instance()
            .get::<DataKey, Address>(&DataKey::Admin)
        {
            admin.require_auth();
        }
        env.storage()
            .instance()
            .set(&DataKey::Threshold, &threshold);
        Ok(())
    }

    /// Casts a community verification vote (`is_genuine = true` or `false`) on `report_id`.
    /// Rejects duplicate votes from the same address on the same report and emits
    /// `ReportVerified` exactly once when genuine votes reach the configured threshold.
    pub fn vote(env: Env, voter: Address, report_id: String, is_genuine: bool) {
        voter.require_auth();

        let votes_key = DataKey::Votes(report_id.clone());
        let mut tally: VoteTally = env.storage().persistent().get(&votes_key).unwrap_or(VoteTally {
            genuine: 0,
            fake: 0,
            voters: Vec::new(&env),
        });

        for existing_voter in tally.voters.iter() {
            if existing_voter == voter {
                panic!("voter has already voted on this report");
            }
        }

        tally.voters.push_back(voter);
        if is_genuine {
            tally.genuine = tally.genuine.saturating_add(1);
        } else {
            tally.fake = tally.fake.saturating_add(1);
        }

        let threshold = Self::get_threshold(env.clone());
        let verified_key = DataKey::Verified(report_id.clone());
        let already_verified: bool = env
            .storage()
            .persistent()
            .get(&verified_key)
            .unwrap_or(false);

        if !already_verified && tally.genuine >= threshold {
            env.storage().persistent().set(&verified_key, &true);
            env.events().publish(
                (Symbol::new(&env, "ReportVerified"), EVENT_REPORT_VERIFIED),
                ReportVerifiedEvent {
                    report_id: report_id.clone(),
                    genuine_votes: tally.genuine,
                    threshold,
                },
            );
        }

        env.storage().persistent().set(&votes_key, &tally);
    }

    /// Returns the current `VoteTally` (genuine count, fake count, and voter list) for `report_id`.
    pub fn get_votes(env: Env, report_id: String) -> VoteTally {
        let votes_key = DataKey::Votes(report_id);
        env.storage().persistent().get(&votes_key).unwrap_or(VoteTally {
            genuine: 0,
            fake: 0,
            voters: Vec::new(&env),
        })
    }

    /// Returns `true` once `report_id` has reached the genuine-vote verification threshold.
    pub fn is_verified(env: Env, report_id: String) -> bool {
        let verified_key = DataKey::Verified(report_id);
        env.storage()
            .persistent()
            .get(&verified_key)
            .unwrap_or(false)
    }

    /// Returns the genuine-vote threshold required to verify a report.
    pub fn get_threshold(env: Env) -> u32 {
        env.storage()
            .instance()
            .get(&DataKey::Threshold)
            .unwrap_or(DEFAULT_THRESHOLD)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::{Address as _, Events};

    #[test]
    fn test_normal_vote_and_get_votes() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(VerificationVotingContract, ());
        let client = VerificationVotingContractClient::new(&env, &contract_id);

        let voter1 = Address::generate(&env);
        let voter2 = Address::generate(&env);
        let report_id = String::from_str(&env, "report-lagos-001");

        assert_eq!(client.get_threshold(), 3);
        assert!(!client.is_verified(&report_id));

        client.vote(&voter1, &report_id, &true);
        client.vote(&voter2, &report_id, &false);

        let tally = client.get_votes(&report_id);
        assert_eq!(tally.genuine, 1);
        assert_eq!(tally.fake, 1);
        assert_eq!(tally.voters.len(), 2);
        assert_eq!(tally.voters.get(0).unwrap(), voter1);
        assert_eq!(tally.voters.get(1).unwrap(), voter2);
        assert!(!client.is_verified(&report_id));
    }

    #[test]
    #[should_panic(expected = "voter has already voted on this report")]
    fn test_duplicate_vote_rejected() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(VerificationVotingContract, ());
        let client = VerificationVotingContractClient::new(&env, &contract_id);

        let voter = Address::generate(&env);
        let report_id = String::from_str(&env, "report-duplicate-002");

        client.vote(&voter, &report_id, &true);
        client.vote(&voter, &report_id, &false);
    }

    #[test]
    fn test_threshold_reached_emits_report_verified_once() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(VerificationVotingContract, ());
        let client = VerificationVotingContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        client.initialize(&admin, &2);
        assert_eq!(client.get_threshold(), 2);

        let voter1 = Address::generate(&env);
        let voter2 = Address::generate(&env);
        let voter3 = Address::generate(&env);
        let report_id = String::from_str(&env, "report-verified-003");

        client.vote(&voter1, &report_id, &true);
        assert!(!client.is_verified(&report_id));
        assert_eq!(env.events().all().len(), 0);

        // Second genuine vote reaches threshold (2) -> ReportVerified emitted
        client.vote(&voter2, &report_id, &true);
        assert!(client.is_verified(&report_id));
        assert_eq!(env.events().all().len(), 1);

        // Third genuine vote after verification should NOT re-emit ReportVerified
        client.vote(&voter3, &report_id, &true);
        assert_eq!(env.events().all().len(), 0);

        let tally = client.get_votes(&report_id);
        assert_eq!(tally.genuine, 3);
        assert_eq!(tally.fake, 0);
        assert_eq!(tally.voters.len(), 3);
    }
}
