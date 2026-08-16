use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod my_project {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let state = &mut ctx.accounts.state;
        state.admin = ctx.accounts.admin.key();
        state.treasury = ctx.accounts.admin.key();
        state.paused = false;
        state.total_staked = 0;
        state.total_withdrawn = 0;
        state.bump = ctx.bumps.state;
        state.allowlist = vec![];
        Ok(())
    }

    pub fn set_admin(ctx: Context<SetAdmin>, new_admin: Pubkey) -> Result<()> {
        require_keys_eq!(ctx.accounts.state.admin, ctx.accounts.admin.key(), MyError::Unauthorized);
        ctx.accounts.state.admin = new_admin;
        Ok(())
    }

    pub fn set_pause(ctx: Context<SetPause>, paused: bool) -> Result<()> {
        require_keys_eq!(ctx.accounts.state.admin, ctx.accounts.admin.key(), MyError::Unauthorized);
        ctx.accounts.state.paused = paused;
        Ok(())
    }

    pub fn set_treasury(ctx: Context<SetTreasury>, treasury: Pubkey) -> Result<()> {
        require_keys_eq!(ctx.accounts.state.admin, ctx.accounts.admin.key(), MyError::Unauthorized);
        ctx.accounts.state.treasury = treasury;
        Ok(())
    }

    pub fn toggle_allowlist(ctx: Context<ToggleAllowlist>, user: Pubkey) -> Result<()> {
        require_keys_eq!(ctx.accounts.state.admin, ctx.accounts.admin.key(), MyError::Unauthorized);

        if let Some(index) = ctx.accounts.state.allowlist.iter().position(|existing| *existing == user) {
            ctx.accounts.state.allowlist.remove(index);
        } else {
            if ctx.accounts.state.allowlist.len() >= 32 {
                return err!(MyError::AllowlistFull);
            }
            ctx.accounts.state.allowlist.push(user);
        }

        Ok(())
    }

    pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> {
        require!(!ctx.accounts.state.paused, MyError::Paused);
        require!(amount > 0, MyError::InvalidAmount);

        let staker = &mut ctx.accounts.staker;
        staker.owner = ctx.accounts.user.key();
        staker.amount = staker.amount.checked_add(amount).ok_or(MyError::Overflow)?;
        staker.staked_at = Clock::get()?.unix_timestamp;
        staker.bump = ctx.bumps.staker;

        ctx.accounts.state.total_staked = ctx.accounts
            .state
            .total_staked
            .checked_add(amount)
            .ok_or(MyError::Overflow)?;

        Ok(())
    }

    pub fn unstake(ctx: Context<Unstake>, amount: u64) -> Result<()> {
        require!(!ctx.accounts.state.paused, MyError::Paused);
        require_keys_eq!(ctx.accounts.staker.owner, ctx.accounts.user.key(), MyError::Unauthorized);
        require!(ctx.accounts.staker.amount >= amount, MyError::InsufficientBalance);

        let staker = &mut ctx.accounts.staker;
        staker.amount = staker.amount.checked_sub(amount).ok_or(MyError::Overflow)?;
        staker.staked_at = Clock::get()?.unix_timestamp;

        ctx.accounts.state.total_staked = ctx.accounts
            .state
            .total_staked
            .checked_sub(amount)
            .ok_or(MyError::Overflow)?;

        ctx.accounts.state.total_withdrawn = ctx.accounts
            .state
            .total_withdrawn
            .checked_add(amount)
            .ok_or(MyError::Overflow)?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + 32 + 32 + 1 + 8 + 8 + 1 + 4 + (32 * 32),
        seeds = [b"state"],
        bump
    )]
    pub state: Account<'info, GlobalState>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SetAdmin<'info> {
    #[account(mut, seeds = [b"state"], bump = state.bump)]
    pub state: Account<'info, GlobalState>,
    #[account(mut)]
    pub admin: Signer<'info>,
}

#[derive(Accounts)]
pub struct SetPause<'info> {
    #[account(mut, seeds = [b"state"], bump = state.bump)]
    pub state: Account<'info, GlobalState>,
    #[account(mut)]
    pub admin: Signer<'info>,
}

#[derive(Accounts)]
pub struct SetTreasury<'info> {
    #[account(mut, seeds = [b"state"], bump = state.bump)]
    pub state: Account<'info, GlobalState>,
    #[account(mut)]
    pub admin: Signer<'info>,
}

#[derive(Accounts)]
pub struct ToggleAllowlist<'info> {
    #[account(mut, seeds = [b"state"], bump = state.bump)]
    pub state: Account<'info, GlobalState>,
    #[account(mut)]
    pub admin: Signer<'info>,
}

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(mut, seeds = [b"state"], bump = state.bump)]
    pub state: Account<'info, GlobalState>,
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + 32 + 8 + 8 + 1,
        seeds = [b"staker", user.key().as_ref()],
        bump
    )]
    pub staker: Account<'info, StakerState>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Unstake<'info> {
    #[account(mut, seeds = [b"state"], bump = state.bump)]
    pub state: Account<'info, GlobalState>,
    #[account(mut, seeds = [b"staker", user.key().as_ref()], bump = staker.bump)]
    pub staker: Account<'info, StakerState>,
    #[account(mut)]
    pub user: Signer<'info>,
}

#[account]
pub struct GlobalState {
    pub admin: Pubkey,
    pub treasury: Pubkey,
    pub paused: bool,
    pub total_staked: u64,
    pub total_withdrawn: u64,
    pub bump: u8,
    pub allowlist: Vec<Pubkey>,
}

#[account]
pub struct StakerState {
    pub owner: Pubkey,
    pub amount: u64,
    pub staked_at: i64,
    pub bump: u8,
}

#[error_code]
pub enum MyError {
    #[msg("Unauthorized authority")]
    Unauthorized,
    #[msg("The contract is paused")]
    Paused,
    #[msg("Invalid amount provided")]
    InvalidAmount,
    #[msg("Insufficient balance")]
    InsufficientBalance,
    #[msg("Allowlist is full")]
    AllowlistFull,
    #[msg("Arithmetic overflow")]
    Overflow,
}
