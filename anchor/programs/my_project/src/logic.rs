use anchor_lang::prelude::Pubkey;

pub const MAX_ALLOWLIST: usize = 32;

#[derive(Debug, PartialEq, Eq)]
pub enum ToggleOutcome {
    Added,
    Removed,
    Full,
}

/// Adds `user` if absent, removes it if present. Returns `Full` (no-op) when
/// adding would exceed `max`.
pub fn toggle_entry(list: &mut Vec<Pubkey>, user: Pubkey, max: usize) -> ToggleOutcome {
    if let Some(index) = list.iter().position(|existing| *existing == user) {
        list.remove(index);
        ToggleOutcome::Removed
    } else if list.len() >= max {
        ToggleOutcome::Full
    } else {
        list.push(user);
        ToggleOutcome::Added
    }
}

/// Returns (new_staker_amount, new_total_staked) or None on overflow.
pub fn apply_stake(staker_amount: u64, total_staked: u64, amount: u64) -> Option<(u64, u64)> {
    Some((
        staker_amount.checked_add(amount)?,
        total_staked.checked_add(amount)?,
    ))
}

/// Returns (new_staker_amount, new_total_staked, new_total_withdrawn) or None
/// on underflow/overflow.
pub fn apply_unstake(
    staker_amount: u64,
    total_staked: u64,
    total_withdrawn: u64,
    amount: u64,
) -> Option<(u64, u64, u64)> {
    Some((
        staker_amount.checked_sub(amount)?,
        total_staked.checked_sub(amount)?,
        total_withdrawn.checked_add(amount)?,
    ))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn pk(byte: u8) -> Pubkey {
        Pubkey::new_from_array([byte; 32])
    }

    #[test]
    fn toggle_adds_missing_entry() {
        let mut list = vec![pk(1)];
        assert_eq!(toggle_entry(&mut list, pk(2), MAX_ALLOWLIST), ToggleOutcome::Added);
        assert_eq!(list, vec![pk(1), pk(2)]);
    }

    #[test]
    fn toggle_removes_existing_entry() {
        let mut list = vec![pk(1), pk(2), pk(3)];
        assert_eq!(toggle_entry(&mut list, pk(2), MAX_ALLOWLIST), ToggleOutcome::Removed);
        assert_eq!(list, vec![pk(1), pk(3)]);
    }

    #[test]
    fn toggle_rejects_when_full() {
        let mut list: Vec<Pubkey> = (0..MAX_ALLOWLIST as u8).map(pk).collect();
        assert_eq!(toggle_entry(&mut list, pk(200), MAX_ALLOWLIST), ToggleOutcome::Full);
        assert_eq!(list.len(), MAX_ALLOWLIST);
    }

    #[test]
    fn toggle_removes_even_when_full() {
        let mut list: Vec<Pubkey> = (0..MAX_ALLOWLIST as u8).map(pk).collect();
        assert_eq!(toggle_entry(&mut list, pk(0), MAX_ALLOWLIST), ToggleOutcome::Removed);
        assert_eq!(list.len(), MAX_ALLOWLIST - 1);
    }

    #[test]
    fn stake_accumulates_both_counters() {
        assert_eq!(apply_stake(10, 100, 5), Some((15, 105)));
        assert_eq!(apply_stake(0, 0, 1), Some((1, 1)));
    }

    #[test]
    fn stake_detects_staker_overflow() {
        assert_eq!(apply_stake(u64::MAX, 0, 1), None);
    }

    #[test]
    fn stake_detects_total_overflow() {
        assert_eq!(apply_stake(0, u64::MAX, 1), None);
    }

    #[test]
    fn unstake_updates_all_counters() {
        assert_eq!(apply_unstake(15, 105, 7, 5), Some((10, 100, 12)));
        assert_eq!(apply_unstake(5, 5, 0, 5), Some((0, 0, 5)));
    }

    #[test]
    fn unstake_detects_staker_underflow() {
        assert_eq!(apply_unstake(4, 100, 0, 5), None);
    }

    #[test]
    fn unstake_detects_total_underflow() {
        assert_eq!(apply_unstake(10, 3, 0, 5), None);
    }

    #[test]
    fn unstake_detects_withdrawn_overflow() {
        assert_eq!(apply_unstake(10, 100, u64::MAX, 5), None);
    }
}
