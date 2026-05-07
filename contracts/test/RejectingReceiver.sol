// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IPaymentRequest {
    function createRequest(uint256 amount, string calldata label) external returns (bytes32 id);
    function createRequestWithPayout(uint256 amount, string calldata label, address payable payoutAddress) external returns (bytes32 id);
    function withdrawProceeds(address payable to) external;
}

contract RejectingReceiver {
    function createRequest(
        address paymentRequest,
        uint256 amount,
        string calldata label
    ) external returns (bytes32 id) {
        return IPaymentRequest(paymentRequest).createRequest(amount, label);
    }

    function createRequestWithPayout(
        address paymentRequest,
        uint256 amount,
        string calldata label,
        address payable payoutAddress
    ) external returns (bytes32 id) {
        return IPaymentRequest(paymentRequest).createRequestWithPayout(amount, label, payoutAddress);
    }

    function withdrawTo(address paymentRequest, address payable to) external {
        IPaymentRequest(paymentRequest).withdrawProceeds(to);
    }

    receive() external payable {
        revert("I do not accept direct transfers");
    }
}
