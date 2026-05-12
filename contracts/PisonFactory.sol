// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract PisonSimpleToken is ERC20 {
    constructor(
        string memory name,
        string memory symbol,
        uint256 supply,
        address owner
    ) ERC20(name, symbol) {
        _mint(owner, supply * 10 ** decimals());
    }
}

contract PisonAdvancedToken is ERC20 {
    bool public burnEnabled;
    address public owner;
    address public taxWallet;
    address public liquidityPair;

    uint256 public buyTax;
    uint256 public sellTax;

    uint256 public maxWallet;
    uint256 public maxTx;

    mapping(address => bool) public isExcluded;

    constructor(
        string memory name,
        string memory symbol,
        uint256 supply,
        address _owner,
        bool _burnEnabled,
        uint256 _buyTax,
        uint256 _sellTax,
        uint256 _maxWalletPercent,
        uint256 _maxTxPercent
    ) ERC20(name, symbol) {
        require(_buyTax <= 10, "Buy tax too high");
        require(_sellTax <= 10, "Sell tax too high");

        owner = _owner;
        taxWallet = _owner;
        burnEnabled = _burnEnabled;
        buyTax = _buyTax;
        sellTax = _sellTax;

        uint256 total = supply * 10 ** decimals();

        maxWallet = (total * _maxWalletPercent) / 100;
        maxTx = (total * _maxTxPercent) / 100;

        isExcluded[_owner] = true;

        _mint(_owner, total);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    function setLiquidityPair(address _pair) public onlyOwner {
        liquidityPair = _pair;
    }

    function burn(uint256 amount) public {
        require(burnEnabled == true, "Burn not enabled");
        _burn(msg.sender, amount);
    }

    function _update(
        address from,
        address to,
        uint256 amount
    ) internal override {

        if (!isExcluded[from] && !isExcluded[to]) {
            require(amount <= maxTx, "Exceeds max transaction");

            if (to != liquidityPair) {
                require(
                    balanceOf(to) + amount <= maxWallet,
                    "Exceeds max wallet"
                );
            }
        }

        if (
            from == address(0) ||
            to == address(0) ||
            liquidityPair == address(0)
        ) {
            super._update(from, to, amount);
            return;
        }

        uint256 taxAmount = 0;

        if (from == liquidityPair && buyTax > 0) {
            taxAmount = (amount * buyTax) / 100;
        } else if (to == liquidityPair && sellTax > 0) {
            taxAmount = (amount * sellTax) / 100;
        }

        if (taxAmount > 0) {
            uint256 sendAmount = amount - taxAmount;

            super._update(from, taxWallet, taxAmount);
            super._update(from, to, sendAmount);
        } else {
            super._update(from, to, amount);
        }
    }
}

contract PisonFactory {
    address public owner;
    address public feeWallet;

    uint256 public simpleFee = 0.015 ether;
    uint256 public advancedFee = 0.05 ether;

    function setSimpleFee(uint256 newFee) public {
    require(msg.sender == owner, "Not owner");
    simpleFee = newFee;
    }

    function setAdvancedFee(uint256 newFee) public {
        require(msg.sender == owner, "Not owner");
        advancedFee = newFee;
    }

    function setFeeWallet(address newWallet) public {
        require(msg.sender == owner, "Not owner");
        feeWallet = newWallet;
    }

    address[] public allTokens;

    event TokenCreated(
        address tokenAddress,
        address tokenOwner,
        string tokenType,
        bool burnEnabled,
        uint256 buyTax,
        uint256 sellTax
    );

    constructor(address _feeWallet) {
    owner = msg.sender;
    feeWallet = _feeWallet;
    }

    function createSimpleToken(
        string memory name,
        string memory symbol,
        uint256 supply
    ) public payable {
        require(msg.value >= simpleFee, "Not enough fee");

        PisonSimpleToken token = new PisonSimpleToken(
            name,
            symbol,
            supply,
            msg.sender
        );

        allTokens.push(address(token));

        emit TokenCreated(address(token), msg.sender, "Simple", false, 0, 0);
    }

   function createAdvancedToken(
    string memory name,
    string memory symbol,
    uint256 supply,
    bool burnEnabled,
    uint256 buyTax,
    uint256 sellTax,
    uint256 maxWalletPercent,
    uint256 maxTxPercent
) public payable {
    require(msg.value >= advancedFee, "Not enough fee");

    PisonAdvancedToken token = new PisonAdvancedToken(
        name,
        symbol,
        supply,
        msg.sender,
        burnEnabled,
        buyTax,
        sellTax,
        maxWalletPercent,
        maxTxPercent
    );

    allTokens.push(address(token));

    emit TokenCreated(
        address(token),
        msg.sender,
        "Advanced",
        burnEnabled,
        buyTax,
        sellTax
    );
}

    function withdraw() public {
        require(msg.sender == owner, "Not owner");

        payable(feeWallet).transfer(
            address(this).balance
        );
    }

    function getAllTokens() public view returns (address[] memory) {
        return allTokens;
    }
}