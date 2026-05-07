// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract PaymentRequest {
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    struct PaymentRecord {
        address payer;
        uint256 amount;
        uint256 paidAt;
    }

    struct Request {
        address creator;
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

    uint256 private constant _MAX_LABEL_LENGTH = 256;
    uint256 public constant RESCUE_TIMEOUT = 30 days;

    mapping(bytes32 => Request) public requests;
    mapping(string  => address) public usernameToAddress;
    mapping(address => string)  public addressToUsername;
    mapping(address => uint256) public pendingWithdrawals;
    mapping(address => uint256) public pendingWithdrawalsQueuedAt;
    mapping(bytes32 => address payable) public requestPayoutAddresses;
    mapping(address => uint256) private _nonces;
    mapping(bytes32 => PaymentRecord[]) private _requestPayments;

    uint256 private _status = _NOT_ENTERED;

    event RequestCreated(
        bytes32 indexed id,
        address indexed creator,
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
    event RequestPayoutConfigured(
        bytes32 indexed id,
        address indexed payoutAddress
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
        return _createRequest(msg.sender, amount, label, false, payable(msg.sender));
    }

    function createReusableRequest(
        uint256 amount,
        string calldata label
    ) external returns (bytes32 id) {
        return _createRequest(msg.sender, amount, label, true, payable(msg.sender));
    }

    function createRequestWithPayout(
        uint256 amount,
        string calldata label,
        address payable payoutAddress
    ) external returns (bytes32 id) {
        return _createRequest(msg.sender, amount, label, false, payoutAddress);
    }

    function createReusableRequestWithPayout(
        uint256 amount,
        string calldata label,
        address payable payoutAddress
    ) external returns (bytes32 id) {
        return _createRequest(msg.sender, amount, label, true, payoutAddress);
    }

    function createRequestFor(
        address recipient,
        uint256 amount,
        string calldata label
    ) external returns (bytes32 id) {
        return _createRequest(recipient, amount, label, false, payable(recipient));
    }

    function createReusableRequestFor(
        address recipient,
        uint256 amount,
        string calldata label
    ) external returns (bytes32 id) {
        return _createRequest(recipient, amount, label, true, payable(recipient));
    }

    function createRequestForWithPayout(
        address recipient,
        uint256 amount,
        string calldata label,
        address payable payoutAddress
    ) external returns (bytes32 id) {
        require(msg.sender == recipient, "Only recipient can set payout");
        return _createRequest(recipient, amount, label, false, payoutAddress);
    }

    function createReusableRequestForWithPayout(
        address recipient,
        uint256 amount,
        string calldata label,
        address payable payoutAddress
    ) external returns (bytes32 id) {
        require(msg.sender == recipient, "Only recipient can set payout");
        return _createRequest(recipient, amount, label, true, payoutAddress);
    }

    function _createRequest(
        address recipient,
        uint256 amount,
        string calldata label,
        bool reusable,
        address payable payoutAddress
    ) internal returns (bytes32 id) {
        require(recipient != address(0), "Zero recipient");
        require(payoutAddress != address(0), "Zero payout");
        require(bytes(label).length > 0, "Empty label");
        require(bytes(label).length <= _MAX_LABEL_LENGTH, "Label too long");

        address creator = msg.sender;
        uint256 createdAt = block.timestamp;
        id = keccak256(
            abi.encode(creator, recipient, amount, label, createdAt, reusable, _nonces[creator]++)
        );
        requests[id] = Request({
            creator: creator,
            recipient: payable(recipient),
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
        requestPayoutAddresses[id] = payoutAddress;
        emit RequestCreated(id, creator, recipient, amount, label, createdAt, reusable);
        emit RequestPayoutConfigured(id, payoutAddress);
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
        _requestPayments[id].push(PaymentRecord({
            payer: msg.sender,
            amount: msg.value,
            paidAt: req.paidAt
        }));

        (bool ok,) = req.recipient.call{value: msg.value}("");
        if (!ok) {
            address payable payoutAddress = requestPayoutAddresses[id];
            if (pendingWithdrawals[payoutAddress] == 0) {
                pendingWithdrawalsQueuedAt[payoutAddress] = block.timestamp;
            }
            pendingWithdrawals[payoutAddress] += msg.value;
            emit ProceedsQueued(payoutAddress, msg.value);
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
    }

    function withdrawProceeds(address payable to) external nonReentrant {
        _withdrawQueuedProceeds(msg.sender, to);
    }

    // Rescue proceeds stuck in a contract wallet that cannot call withdrawProceeds itself.
    // Only callable after RESCUE_TIMEOUT (30 days) to prevent front-running griefing.
    function rescueStuckProceeds(address payable payoutAddress) external nonReentrant {
        require(pendingWithdrawalsQueuedAt[payoutAddress] > 0, "Nothing queued");
        require(
            block.timestamp >= pendingWithdrawalsQueuedAt[payoutAddress] + RESCUE_TIMEOUT,
            "Too early"
        );
        _withdrawQueuedProceeds(payoutAddress, payoutAddress);
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

    function getPaymentCount(bytes32 id) external view returns (uint256) {
        return _requestPayments[id].length;
    }

    function getPayment(
        bytes32 id,
        uint256 index
    ) external view returns (address payer, uint256 amount, uint256 paidAt) {
        PaymentRecord storage payment = _requestPayments[id][index];
        return (payment.payer, payment.amount, payment.paidAt);
    }

    function _withdrawQueuedProceeds(address recipient, address payable to) internal {
        require(to != address(0), "Zero address");

        uint256 amount = pendingWithdrawals[recipient];
        require(amount > 0, "Nothing to withdraw");

        pendingWithdrawals[recipient] = 0;
        pendingWithdrawalsQueuedAt[recipient] = 0;

        (bool ok,) = to.call{value: amount}("");
        require(ok, "Withdraw failed");

        emit ProceedsWithdrawn(recipient, to, amount);
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
