// SPDX-License-Identifier: MIT
pragma solidity =0.6.12;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract yGift is ERC721("yearn Gift NFT", "yGIFT") {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    struct Gift {
        address token;
        uint256 amount;
        uint256 start;
        uint256 duration;
        string name;
        string message;
        string url;
    }

    Gift[] public gifts;

    event GiftMinted(
        address indexed from,
        address indexed to,
        uint256 indexed tokenId,
        uint256 unlocksAt
    );
    event Tip(
        address indexed tipper,
        uint256 indexed tokenId,
        address token,
        uint256 amount,
        string message
    );
    event Collected(
        address indexed collector,
        uint256 indexed tokenId,
        address token,
        uint256 amount
    );

    /**
     * @dev Mints a new Gift NFT and places it into the contract address for future collection
     * _to: recipient of the gift
     * _token: token address of the token to be gifted
     * _amount: amount of _token to be gifted
     * _name: name of the gift
     * _msg: Tip message given by the original minter
     * _url: URL link for the image attached to the nft
     * _start: the amount of time the gift will be locked until the recipient can collect it
     * _duration: duration over which the amount linearly becomes available  *
     *
     * requirement: only a whitelisted minter can call this function
     *
     * Emits a {Tip} event.
     */
    function mint(
        address _to,
        address _token,
        uint256 _amount,
        string calldata _name,
        string calldata _msg,
        string calldata _url,
        uint256 _start,
        uint256 _duration
    ) external {
        uint256 _id = gifts.length;
        gifts.push(
            Gift({
                token: _token,
                name: _name,
                message: _msg,
                url: _url,
                amount: _amount,
                start: _start,
                duration: _duration
            })
        );
        _safeMint(_to, _id);
        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);
        emit GiftMinted(msg.sender, _to, _id, _start);
        emit Tip(msg.sender, _id, _token, _amount, _msg);
    }

    /**
     * @dev Tip some tokens to Gift NFT
     * _tokenId: gift in which the function caller would like to tip
     * _amount: amount of _token to be gifted
     * _msg: Tip message given by the original minter
     *
     * Emits a {Tip} event.
     */
    function tip(
        uint256 _tokenId,
        uint256 _amount,
        string calldata _msg
    ) external {
        require(_tokenId < gifts.length, "yGift: Token ID does not exist.");
        Gift storage gift = gifts[_tokenId];
        gift.amount = gift.amount.add(_amount);
        IERC20(gift.token).safeTransferFrom(msg.sender, address(this), _amount);
        emit Tip(msg.sender, _tokenId, gift.token, _amount, _msg);
    }

    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }

    /**
     * @dev Returns the available amount of tokens based on vesting parametres
     * _amount: amount of tokens in the gift
     * _start: Time at which the cliff ends
     * _duration: vesting period
     *
     */
    function available(
        uint256 _amount,
        uint256 _start,
        uint256 _duration
    ) public view returns (uint256) {
        if (_start > block.timestamp) return 0;
        if (_duration == 0) return _amount;
        return (_amount * min(block.timestamp - _start, _duration)) / _duration;
    }

    /**
     * @dev Allows the gift recipient to collect their tokens
     * _tokenId: gift in which the function caller would like to tip
     * _amount: amount of tokens the gift owner would like to collect
     *
     * requirement: caller must own the gift recipient && gift must have been redeemed
     */
    function collect(uint256 _tokenId, uint256 _amount) public {
        require(
            _isApprovedOrOwner(msg.sender, _tokenId),
            "yGift: You are not the NFT owner"
        );

        Gift storage gift = gifts[_tokenId];

        require(gift.start < block.timestamp, "yGift: Rewards still vesting");
        uint256 _available = available(gift.amount, gift.start, gift.duration);
        if (_amount > _available) _amount = _available;
        require(_amount > 0, "yGift: insufficient amount");

        gift.amount = gift.amount.sub(_amount);
        IERC20(gift.token).safeTransfer(msg.sender, _amount);
        emit Collected(msg.sender, _tokenId, gift.token, _amount);
    }

    function onERC721Received(
        address _operator,
        address _from,
        uint256 _tokenId,
        bytes calldata _data
    ) external view returns (bytes4) {
        require(
            msg.sender == address(this),
            "yGift: Cannot receive other NFTs"
        );
        return yGift.onERC721Received.selector;
    }
}
