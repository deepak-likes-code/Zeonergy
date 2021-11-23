// SPDX-License-Identifier:MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract MyToken is ERC1155, Ownable {
    // Variables
    using Counters for Counters.Counter;
    Counters.Counter public _tokenIds;
    address public pool;
    // Contract name
    string public name;

    struct Creator {
        address creatorAddress;
        string name;
        uint256 registeredDate;
        bool registrationStatus;
    }

    mapping(uint256 => uint256) public tokensAvailable;

    mapping(address => Token[]) public buyerToTokens;
    mapping(address => Creator) public registeredCreator;

    uint256 percentageOfSale;

    struct Token {
        uint256 id;
        Creator creator;
        string tokenName;
        string mediaUrl;
        uint256 cost;
        uint256 amountAvailable;
        uint256 totalSupply;
        uint256 createdTime;
    }
    mapping(uint256 => Token) public idToToken;
    address[] public registeredCreators;
    address[] public registeredUsers;
    mapping(address => Token[]) public creatorTokens;

    constructor(string memory collectionName, uint256 percent)
        ERC1155("Creator Nation")
    {
        name = collectionName;
        pool = msg.sender;
        percentageOfSale = percent;
    }

    function contractURI() public pure returns (string memory) {
        return "https://jsonkeeper.com/b/OJOC";
    }

    // Modifiers
    modifier onlyCreator() {
        require(
            registeredCreator[msg.sender].registrationStatus == true,
            "be a creator!"
        );
        _;
    }

    // Events
    event onMint(
        address minter,
        string tokenName,
        uint256 tokenID,
        uint256 cost,
        uint256 totalSupply
    );

    // Functions
    function registerCreator(address creatorAddress, string memory name)
        public
        onlyOwner
        returns (bool)
    {
        Creator memory _creator;
        _creator = Creator(creatorAddress, name, block.timestamp, true);
        registeredCreator[creatorAddress] = _creator;
        registeredCreators.push(creatorAddress);
        return true;
    }

    // function setURI(string memory newuri) private {
    //     _setURI(newuri);
    //     _tokenIds.increment();
    // }

    function mint(
        string memory tokenName,
        uint256 cost,
        uint256 total,
        string memory uri,
        string memory mediaUrl
    ) public onlyCreator {
        require(creatorTokens[msg.sender].length < 6, "max of 6 Tokens only");
        Token memory _token;

        _token = Token(
            _tokenIds.current() + 1,
            registeredCreator[msg.sender],
            tokenName,
            mediaUrl,
            cost,
            total,
            total,
            block.timestamp
        );

        idToToken[_tokenIds.current() + 1] = _token;
        creatorTokens[msg.sender].push(_token);
        _setURI(uri);
        _tokenIds.increment();
        uint256 id = _tokenIds.current();
        _mint(msg.sender, id, total, "");
        setApprovalForAll(address(this), true);
        tokensAvailable[id] = total;
        emit onMint(msg.sender, tokenName, id, cost, total);
    }

    // Marketplace Functions

    function buyTokens(uint256 _tokenId, uint256 _amount)
        public
        payable
        returns (bool)
    {
        require(
            msg.value >= idToToken[_tokenId].cost * _amount,
            "not equal to token's value"
        );
        uint256 amountOfTokensLeft = tokensAvailable[_tokenId];
        address tokenCreator = idToToken[_tokenId].creator.creatorAddress;
        require(_amount <= amountOfTokensLeft, "Tokens not available");

        uint256 amountToTransferToCreator = (msg.value *
            (100 - percentageOfSale)) / 100;
        uint256 amountToTransferToPool = (msg.value * percentageOfSale) / 100;

        payable(tokenCreator).transfer(amountToTransferToCreator);
        payable(pool).transfer(amountToTransferToPool);

        tokensAvailable[_tokenId] -= _amount;
        idToToken[_tokenId].amountAvailable -= _amount;

        // Token memory transferToken = Token(
        //     _tokenId,
        //     idToToken[_tokenId].creator,
        //     idToToken[_tokenId].tokenName,
        //     idToToken[_tokenId].mediaUrl,
        //     idToToken[_tokenId].cost,
        //     _amount,
        //     idToToken[_tokenId].totalSupply,
        //     block.timestamp
        // );

        // pushToBuyerTokens(transferToken, msg.sender);

        buyerToTokens[msg.sender].push(idToToken[_tokenId]);
        _safeTransferFrom(tokenCreator, msg.sender, _tokenId, _amount, "");

        return true;
    }

    // function pushToBuyerTokens(Token memory token, address sender) internal {
    //     if (buyerToTokens[sender].length == 0) {
    //         buyerToTokens[sender].push(token);
    //     } else if (buyerToTokens[sender].length > 0) {
    //         uint256 id = token.id;
    //         uint256 amount = token.amountAvailable;

    //         uint256 x;

    //         for (uint256 i = 0; i < buyerToTokens[sender].length; i++) {
    //             if (buyerToTokens[sender][i].id == id) {
    //                 x += 1;
    //                 buyerToTokens[sender][i].amountAvailable += amount;
    //             }
    //         }

    //         if (x == 0) {
    //             buyerToTokens[sender].push(token);
    //         }
    //     }
    // }

    // Fetch my NFTs
    function fetchCreatedNFTs() public view returns (Token[] memory itemList) {
        address creator = msg.sender;
        if (creatorTokens[creator].length > 0) {
            uint256 length = creatorTokens[creator].length;

            Token[] memory items = new Token[](length);
            uint256 id;
            for (uint256 i = 0; i < length; i++) {
                id = creatorTokens[creator][i].id;
                items[i] = idToToken[id];
            }
            return items;
        }
    }

    // Fetch the NFTs available for sale (i.e. which have more than 1 token available)

    function fetchAvailableNFTs()
        public
        view
        returns (Token[] memory itemList)
    {
        Token[] memory items;

        if (_tokenIds.current() == 0) {
            return items;
        }

        uint256 length;

        for (uint256 i = 1; i <= _tokenIds.current(); i++) {
            if (idToToken[i].amountAvailable > 0) {
                length += 1;
            }
        }

        if (length < 1) {
            return items;
        }

        uint256 tokenCount;
        Token[] memory newItems = new Token[](length);
        for (uint256 i = 1; i <= _tokenIds.current(); i++) {
            if (idToToken[i].amountAvailable > 0) {
                newItems[tokenCount] = idToToken[i];
                tokenCount += 1;
            }
        }
        return newItems;
    }

    function fetchBoughtNFTs() public view returns (Token[] memory itemList) {
        address buyer = msg.sender;
        if (buyerToTokens[buyer].length > 0) {
            uint256 length = buyerToTokens[buyer].length;

            Token[] memory items = new Token[](length);

            for (uint256 i = 0; i < length; i++) {
                items[i] = buyerToTokens[buyer][i];
            }
            return items;
        }
    }
}
