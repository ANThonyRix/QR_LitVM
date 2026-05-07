// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract PaymentRequest {
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    struct Request {
        address payable recipient;
        uint256 amount;
        string  label;
        uint256 createdAt;
        bool    paid;
        address payer;
        uint256 paidAt;
        bool    reusable;
        uint256 paymentCount;
        uint256 totalPaid;
    }

    mapping(bytes32 => Request) public requests;
    mapping(string  => address) public usernameToAddress;
    mapping(address => string)  public addressToUsername;
    mapping(address => uint256) public pendingWithdrawals;

    uint256 private _status = _NOT_ENTERED;

    event RequestCreated(
        bytes32 indexed id,
        address indexed recipient,
        uint256 amount,
        string  label,
        uint256 createdAt,
        bool    reusable
    );
    event RequestPaid(
        bytes32 indexed id,
        address indexed payer,
        address indexed recipient,
        uint256 amount,
        string  label,
        uint256 paidAt,
        uint256 paymentCount,
        uint256 totalPaid,
        bool    reusable
    );
    event UsernameRegistered(
        address indexed user,
        string username
    );
    event UsernameChanged(
        address indexed user,
        string oldUsername,
        string newUsername
    );
    event ProceedsQueued(
        address indexed recipient,
        uint256 amount
    );
    event ProceedsWithdrawn(
        address indexed recipient,
        address indexed to,
        uint256 amount
    );

    modifier nonReentrant() {
        require(_status != _ENTERED, "Reentrancy");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    function createRequest(
        uint256 amount,
        string calldata label
    ) external returns (bytes32 id) {
        return _createRequest(amount, label, false);
    }

    function createReusableRequest(
        uint256 amount,
        string calldata label
    ) external returns (bytes32 id) {
        return _createRequest(amount, label, true);
    }

    function _createRequest(
        uint256 amount,
        string calldata label,
        bool reusable
    ) internal returns (bytes32 id) {
        uint256 createdAt = block.timestamp;
        id = keccak256(
            abi.encodePacked(msg.sender, amount, label, createdAt, reusable, block.prevrandao)
        );
        requests[id] = Request({
            recipient: payable(msg.sender),
            amount:    amount,
            label:     label,
            createdAt: createdAt,
            paid:      false,
            payer:     address(0),
            paidAt:    0,
            reusable:  reusable,
            paymentCount: 0,
            totalPaid: 0
        });
        emit RequestCreated(id, msg.sender, amount, label, createdAt, reusable);
    }

    function pay(bytes32 id) external payable nonReentrant {
        Request storage req = requests[id];
        require(req.recipient != address(0), "Not found");
        if (!req.reusable) {
            require(!req.paid, "Already paid");
        }
        if (req.amount > 0) {
            require(msg.value == req.amount, "Wrong amount");
        } else {
            require(msg.value > 0, "Send zkLTC");
        }

        req.paid   = true;
        req.payer  = msg.sender;
        req.paidAt = block.timestamp;
        req.paymentCount += 1;
        req.totalPaid += msg.value;

        (bool ok,) = req.recipient.call{value: msg.value}("");
        if (!ok) {
            pendingWithdrawals[req.recipient] += msg.value;
            emit ProceedsQueued(req.recipient, msg.value);
        }

        emit RequestPaid(
            id,
            msg.sender,
            req.recipient,
            msg.value,
            req.label,
            req.paidAt,
            req.paymentCount,
            req.totalPaid,
            req.reusable
        );
    }

    function registerUsername(string calldata username) external {
        bytes memory usernameBytes = bytes(username);
        require(usernameBytes.length >= 3,  "Min 3 chars");
        require(usernameBytes.length <= 32, "Max 32 chars");
        _validateUsername(usernameBytes);
        require(usernameToAddress[username] == address(0), "Taken");
        require(bytes(addressToUsername[msg.sender]).length == 0, "Already registered");

        usernameToAddress[username] = msg.sender;
        addressToUsername[msg.sender] = username;

        emit UsernameRegistered(msg.sender, username);
    }

    function changeUsername(string calldata newUsername) external {
        bytes memory usernameBytes = bytes(newUsername);
        require(usernameBytes.length >= 3,  "Min 3 chars");
        require(usernameBytes.length <= 32, "Max 32 chars");
        _validateUsername(usernameBytes);
        require(usernameToAddress[newUsername] == address(0), "Taken");

        string memory oldUsername = addressToUsername[msg.sender];
        if (bytes(oldUsername).length > 0) {
            delete usernameToAddress[oldUsername];
        }

        usernameToAddress[newUsername] = msg.sender;
        addressToUsername[msg.sender] = newUsername;

        emit UsernameChanged(msg.sender, oldUsername, newUsername);
        emit UsernameRegistered(msg.sender, newUsername);
    }

    function withdrawProceeds(address payable to) external nonReentrant {
        require(to != address(0), "Zero address");

        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "Nothing to withdraw");

        pendingWithdrawals[msg.sender] = 0;

        (bool ok,) = to.call{value: amount}("");
        require(ok, "Withdraw failed");

        emit ProceedsWithdrawn(msg.sender, to, amount);
    }

    receive() external payable {
        revert("Use pay");
    }

    fallback() external payable {
        revert("Use pay");
    }

    function requestExists(bytes32 id) external view returns (bool) {
        return requests[id].recipient != address(0);
    }

    function _validateUsername(bytes memory usernameBytes) internal pure {
        for (uint256 i = 0; i < usernameBytes.length; i++) {
            bytes1 char = usernameBytes[i];
            bool isLowercase = char >= 0x61 && char <= 0x7A;
            bool isDigit = char >= 0x30 && char <= 0x39;
            bool isUnderscore = char == 0x5F;

            require(isLowercase || isDigit || isUnderscore, "Invalid username");
        }
    }
}
