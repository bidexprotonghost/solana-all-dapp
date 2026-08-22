// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Minimal treasury template. Deploy only after independent review.
contract EvmTreasury {
    address public immutable admin;

    error NotAdmin();
    error LengthMismatch();

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    constructor(address admin_) {
        if (admin_ == address(0)) revert NotAdmin();
        admin = admin_;
    }

    receive() external payable {}

    function depositTreasury() external payable {}

    function withdrawTreasury(address payable recipient, uint256 amount) external onlyAdmin {
        recipient.transfer(amount);
    }

    function airdrop(address payable[] calldata recipients, uint256[] calldata amounts) external onlyAdmin {
        if (recipients.length != amounts.length) revert LengthMismatch();
        for (uint256 i; i < recipients.length; ++i) recipients[i].transfer(amounts[i]);
    }
}
