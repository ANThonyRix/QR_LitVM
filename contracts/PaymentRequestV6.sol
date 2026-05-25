// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
}

contract PaymentRequestV6 {
    // ─── Structs ────────────────────────────────────────────────────────────────

    struct Request {
        address creator;
        address payable recipient;
        uint256 amount;
        string label;
        uint256 createdAt;
        bool paid;
        address payer;
        uint256 paidAt;
        bool reusable;
        uint256 paymentCount;
        uint256 totalPaid;
        address token; // address(0) = native zkLTC
    }

    struct Payment {
        address payer;
        uint256 amount;
        uint256 paidAt;
    }

    // ─── Events ─────────────────────────────────────────────────────────────────

    event RequestCreated(
        bytes32 indexed id,
        address indexed creator,
        address indexed recipient,
        uint256 amount,
        string label,
        uint256 createdAt,
        bool reusable,
        address token
    );

    event RequestPaid(
        bytes32 indexed id,
        address indexed payer,
        address indexed recipient,
        uint256 amount,
        string label,
        uint256 paidAt,
        uint256 paymentCount,
        uint256 totalPaid,
        bool reusable,
        address token
    );

    event RequestPayoutConfigured(bytes32 indexed id, address indexed payoutAddress);
    event RequestRescueConfigured(bytes32 indexed id, address indexed rescueAddress);
    event ProceedsQueued(address indexed recipient, uint256 amount);
    event ProceedsWithdrawn(address indexed recipient, address indexed to, uint256 amount);
    event UsernameRegistered(address indexed user, string username);
    event UsernameChanged(address indexed user, string oldUsername, string newUsername);

    // ─── State ──────────────────────────────────────────────────────────────────

    mapping(bytes32 => Request) public requests;
    mapping(bytes32 => Payment[]) private requestPayments;
    mapping(bytes32 => address payable) public requestPayoutAddresses;
    mapping(bytes32 => address payable) public requestRescueAddresses;
    mapping(address => uint256) public pendingWithdrawals;
    mapping(bytes32 => uint256) public queuedRequestProceeds;
    mapping(bytes32 => uint256) public queuedRequestQueuedAt;

    // Username mappings
    mapping(address => string) public addressToUsername;
    mapping(string => address) public usernameToAddress;

    uint256 public constant RESCUE_TIMEOUT = 30 days;

    // Reentrancy guard
    uint256 private _locked = 1;
    modifier nonReentrant() {
        require(_locked == 1, "ReentrancyGuard: reentrant call");
        _locked = 2;
        _;
        _locked = 1;
    }

    // ─── Native zkLTC requests (V5-compatible) ──────────────────────────────────

    function createRequest(uint256 amount, string calldata label) external returns (bytes32 id) {
        return _createRequest(msg.sender, amount, label, false, address(0));
    }

    function createRequestFor(address recipient, uint256 amount, string calldata label) external returns (bytes32 id) {
        return _createRequest(recipient, amount, label, false, address(0));
    }

    function createRequestForWithPayout(address recipient, uint256 amount, string calldata label, address payable payoutAddress) external returns (bytes32 id) {
        id = _createRequest(recipient, amount, label, false, address(0));
        _configurePayout(id, payoutAddress);
    }

    function createRequestForWithPayoutAndRescue(address recipient, uint256 amount, string calldata label, address payable payoutAddress, address payable rescueAddress) external returns (bytes32 id) {
        id = _createRequest(recipient, amount, label, false, address(0));
        _configurePayout(id, payoutAddress);
        _configureRescue(id, rescueAddress);
    }

    function createRequestWithPayout(uint256 amount, string calldata label, address payable payoutAddress) external returns (bytes32 id) {
        id = _createRequest(msg.sender, amount, label, false, address(0));
        _configurePayout(id, payoutAddress);
    }

    function createRequestWithPayoutAndRescue(uint256 amount, string calldata label, address payable payoutAddress, address payable rescueAddress) external returns (bytes32 id) {
        id = _createRequest(msg.sender, amount, label, false, address(0));
        _configurePayout(id, payoutAddress);
        _configureRescue(id, rescueAddress);
    }

    function createReusableRequest(uint256 amount, string calldata label) external returns (bytes32 id) {
        return _createRequest(msg.sender, amount, label, true, address(0));
    }

    function createReusableRequestFor(address recipient, uint256 amount, string calldata label) external returns (bytes32 id) {
        return _createRequest(recipient, amount, label, true, address(0));
    }

    function createReusableRequestForWithPayout(address recipient, uint256 amount, string calldata label, address payable payoutAddress) external returns (bytes32 id) {
        id = _createRequest(recipient, amount, label, true, address(0));
        _configurePayout(id, payoutAddress);
    }

    function createReusableRequestForWithPayoutAndRescue(address recipient, uint256 amount, string calldata label, address payable payoutAddress, address payable rescueAddress) external returns (bytes32 id) {
        id = _createRequest(recipient, amount, label, true, address(0));
        _configurePayout(id, payoutAddress);
        _configureRescue(id, rescueAddress);
    }

    function createReusableRequestWithPayout(uint256 amount, string calldata label, address payable payoutAddress) external returns (bytes32 id) {
        id = _createRequest(msg.sender, amount, label, true, address(0));
        _configurePayout(id, payoutAddress);
    }

    function createReusableRequestWithPayoutAndRescue(uint256 amount, string calldata label, address payable payoutAddress, address payable rescueAddress) external returns (bytes32 id) {
        id = _createRequest(msg.sender, amount, label, true, address(0));
        _configurePayout(id, payoutAddress);
        _configureRescue(id, rescueAddress);
    }

    // ─── ERC-20 Token requests (new in V6) ──────────────────────────────────────

    function createTokenRequest(address token, uint256 amount, string calldata label) external returns (bytes32 id) {
        require(token != address(0), "Use createRequest for native");
        return _createRequest(msg.sender, amount, label, false, token);
    }

    function createTokenRequestFor(address recipient, address token, uint256 amount, string calldata label) external returns (bytes32 id) {
        require(token != address(0), "Use createRequestFor for native");
        return _createRequest(recipient, amount, label, false, token);
    }

    function createReusableTokenRequest(address token, uint256 amount, string calldata label) external returns (bytes32 id) {
        require(token != address(0), "Use createReusableRequest for native");
        return _createRequest(msg.sender, amount, label, true, token);
    }

    function createReusableTokenRequestFor(address recipient, address token, uint256 amount, string calldata label) external returns (bytes32 id) {
        require(token != address(0), "Use createReusableRequestFor for native");
        return _createRequest(recipient, amount, label, true, token);
    }

    // ─── Pay functions ──────────────────────────────────────────────────────────

    /// @notice Pay a native zkLTC request
    function pay(bytes32 id) external payable nonReentrant {
        Request storage req = requests[id];
        require(req.recipient != address(0), "Request does not exist");
        require(req.token == address(0), "Use payWithToken for token requests");
        require(req.reusable || !req.paid, "Already paid");

        uint256 amount = req.amount > 0 ? req.amount : msg.value;
        require(msg.value == amount, "Incorrect payment amount");
        require(amount > 0, "Amount must be > 0");

        _recordPayment(id, req, amount);

        // Transfer native token to recipient
        (bool sent, ) = req.recipient.call{value: amount}("");
        if (!sent) {
            // Queue for withdrawal
            pendingWithdrawals[req.recipient] += amount;
            queuedRequestProceeds[id] += amount;
            queuedRequestQueuedAt[id] = block.timestamp;
            emit ProceedsQueued(req.recipient, amount);
        }
    }

    /// @notice Pay an ERC-20 token request
    function payWithToken(bytes32 id) external nonReentrant {
        Request storage req = requests[id];
        require(req.recipient != address(0), "Request does not exist");
        require(req.token != address(0), "Use pay for native requests");
        require(req.reusable || !req.paid, "Already paid");
        require(req.amount > 0, "Token requests must have fixed amount");

        uint256 amount = req.amount;

        IERC20 token = IERC20(req.token);
        uint256 allowance = token.allowance(msg.sender, address(this));
        require(allowance >= amount, "Insufficient token allowance");

        _recordPayment(id, req, amount);

        bool success = token.transferFrom(msg.sender, req.recipient, amount);
        require(success, "Token transfer failed");
    }

    // ─── Withdrawal & Rescue ────────────────────────────────────────────────────

    function withdrawQueuedRequest(bytes32 id, address payable to) external nonReentrant {
        Request storage req = requests[id];
        require(msg.sender == req.recipient || msg.sender == req.creator, "Not authorized");

        uint256 amount = queuedRequestProceeds[id];
        require(amount > 0, "Nothing to withdraw");

        queuedRequestProceeds[id] = 0;
        pendingWithdrawals[req.recipient] -= amount;

        (bool sent, ) = to.call{value: amount}("");
        require(sent, "Withdrawal failed");

        emit ProceedsWithdrawn(req.recipient, to, amount);
    }

    function rescueStuckProceeds(bytes32 id) external nonReentrant {
        address payable rescueAddr = requestRescueAddresses[id];
        require(rescueAddr != address(0), "No rescue address configured");
        require(block.timestamp >= queuedRequestQueuedAt[id] + RESCUE_TIMEOUT, "Rescue timeout not reached");

        uint256 amount = queuedRequestProceeds[id];
        require(amount > 0, "Nothing to rescue");

        Request storage req = requests[id];
        queuedRequestProceeds[id] = 0;
        pendingWithdrawals[req.recipient] -= amount;

        (bool sent, ) = rescueAddr.call{value: amount}("");
        require(sent, "Rescue transfer failed");

        emit ProceedsWithdrawn(req.recipient, rescueAddr, amount);
    }

    // ─── Username system ────────────────────────────────────────────────────────

    function registerUsername(string calldata username) external {
        require(bytes(username).length >= 3 && bytes(username).length <= 32, "Username must be 3-32 chars");
        require(usernameToAddress[username] == address(0), "Username taken");
        require(bytes(addressToUsername[msg.sender]).length == 0, "Already registered");

        addressToUsername[msg.sender] = username;
        usernameToAddress[username] = msg.sender;

        emit UsernameRegistered(msg.sender, username);
    }

    function changeUsername(string calldata newUsername) external {
        require(bytes(newUsername).length >= 3 && bytes(newUsername).length <= 32, "Username must be 3-32 chars");
        require(usernameToAddress[newUsername] == address(0), "Username taken");

        string memory oldUsername = addressToUsername[msg.sender];
        require(bytes(oldUsername).length > 0, "No username registered");

        delete usernameToAddress[oldUsername];
        addressToUsername[msg.sender] = newUsername;
        usernameToAddress[newUsername] = msg.sender;

        emit UsernameChanged(msg.sender, oldUsername, newUsername);
    }

    // ─── View functions ─────────────────────────────────────────────────────────

    function requestExists(bytes32 id) external view returns (bool) {
        return requests[id].recipient != address(0);
    }

    function getPaymentCount(bytes32 id) external view returns (uint256) {
        return requestPayments[id].length;
    }

    function getPayment(bytes32 id, uint256 index) external view returns (address payer, uint256 amount, uint256 paidAt) {
        Payment storage p = requestPayments[id][index];
        return (p.payer, p.amount, p.paidAt);
    }

    // ─── Internal ───────────────────────────────────────────────────────────────

    function _createRequest(address recipient, uint256 amount, string calldata label, bool reusable, address token) internal returns (bytes32 id) {
        id = keccak256(abi.encodePacked(msg.sender, recipient, amount, label, block.timestamp, reusable, token));

        requests[id] = Request({
            creator: msg.sender,
            recipient: payable(recipient),
            amount: amount,
            label: label,
            createdAt: block.timestamp,
            paid: false,
            payer: address(0),
            paidAt: 0,
            reusable: reusable,
            paymentCount: 0,
            totalPaid: 0,
            token: token
        });

        emit RequestCreated(id, msg.sender, recipient, amount, label, block.timestamp, reusable, token);
    }

    function _configurePayout(bytes32 id, address payable payoutAddress) internal {
        requestPayoutAddresses[id] = payoutAddress;
        emit RequestPayoutConfigured(id, payoutAddress);
    }

    function _configureRescue(bytes32 id, address payable rescueAddress) internal {
        requestRescueAddresses[id] = rescueAddress;
        emit RequestRescueConfigured(id, rescueAddress);
    }

    function _recordPayment(bytes32 id, Request storage req, uint256 amount) internal {
        req.paid = true;
        req.payer = msg.sender;
        req.paidAt = block.timestamp;
        req.paymentCount += 1;
        req.totalPaid += amount;

        requestPayments[id].push(Payment({
            payer: msg.sender,
            amount: amount,
            paidAt: block.timestamp
        }));

        emit RequestPaid(id, msg.sender, req.recipient, amount, req.label, block.timestamp, req.paymentCount, req.totalPaid, req.reusable, req.token);
    }

    // ─── Receive / Fallback ─────────────────────────────────────────────────────

    receive() external payable {}
    fallback() external payable {}
}
