// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract PaymentRequest {
    struct Request {
        address payable recipient;
        uint256 amount;
        string  label;
        bool    paid;
        address payer;
        uint256 paidAt;
    }

    mapping(bytes32 => Request) public requests;
    mapping(string  => address) public usernameToAddress;
    mapping(address => string)  public addressToUsername;

    event RequestCreated(
        bytes32 indexed id,
        address indexed recipient,
        uint256 amount,
        string  label
    );
    event RequestPaid(
        bytes32 indexed id,
        address indexed payer,
        uint256 amount
    );
    event UsernameRegistered(
        address indexed user,
        string username
    );

    function createRequest(
        uint256 amount,
        string calldata label
    ) external returns (bytes32 id) {
        id = keccak256(
            abi.encodePacked(msg.sender, amount, label, block.timestamp, block.prevrandao)
        );
        requests[id] = Request({
            recipient: payable(msg.sender),
            amount:    amount,
            label:     label,
            paid:      false,
            payer:     address(0),
            paidAt:    0
        });
        emit RequestCreated(id, msg.sender, amount, label);
    }

    function pay(bytes32 id) external payable {
        Request storage req = requests[id];
        require(req.recipient != address(0), "Not found");
        require(!req.paid, "Already paid");
        if (req.amount > 0) {
            require(msg.value == req.amount, "Wrong amount");
        } else {
            require(msg.value > 0, "Send zkLTC");
        }

        req.paid   = true;
        req.payer  = msg.sender;
        req.paidAt = block.timestamp;

        (bool ok,) = req.recipient.call{value: msg.value}("");
        require(ok, "Transfer failed");

        emit RequestPaid(id, msg.sender, msg.value);
    }

    function registerUsername(string calldata username) external {
        require(bytes(username).length >= 3,  "Min 3 chars");
        require(bytes(username).length <= 32, "Max 32 chars");
        require(usernameToAddress[username] == address(0), "Taken");
        require(bytes(addressToUsername[msg.sender]).length == 0, "Already registered");

        usernameToAddress[username] = msg.sender;
        addressToUsername[msg.sender] = username;

        emit UsernameRegistered(msg.sender, username);
    }
}
