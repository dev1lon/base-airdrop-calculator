// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ─────────────────────────────────────────────────────────────────────────────
// BASE Airdrop Calculator — result card NFT
//
// Self-contained ERC-721 (no imports) so it verifies on BaseScan / Blockscout
// by simply pasting this single file. The token logic follows the audited
// Solmate ERC-721 pattern; on top sits a minimal Ownable and a public, paid
// `mint(uri)` that mints a unique token whose metadata is an off-chain IPFS URI.
//
// Verification settings: Solidity 0.8.20+, single file, no constructor-arg
// surprises (constructor takes the mint price in wei). Optimizer optional.
// ─────────────────────────────────────────────────────────────────────────────

interface IERC165 {
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}

interface IERC721 is IERC165 {
    event Transfer(address indexed from, address indexed to, uint256 indexed id);
    event Approval(address indexed owner, address indexed spender, uint256 indexed id);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    function balanceOf(address owner) external view returns (uint256);
    function ownerOf(uint256 id) external view returns (address);
    function approve(address spender, uint256 id) external;
    function setApprovalForAll(address operator, bool approved) external;
    function getApproved(uint256 id) external view returns (address);
    function isApprovedForAll(address owner, address operator) external view returns (bool);
    function transferFrom(address from, address to, uint256 id) external;
    function safeTransferFrom(address from, address to, uint256 id) external;
    function safeTransferFrom(address from, address to, uint256 id, bytes calldata data) external;
}

interface IERC721Metadata is IERC721 {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function tokenURI(uint256 id) external view returns (string memory);
}

interface IERC721Receiver {
    function onERC721Received(
        address operator,
        address from,
        uint256 id,
        bytes calldata data
    ) external returns (bytes4);
}

contract CardNFT is IERC721Metadata {
    // ─── Ownable ───────────────────────────────────────────────────────────
    address public owner;
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // ─── Metadata ──────────────────────────────────────────────────────────
    string public name;
    string public symbol;

    // ─── Sale ──────────────────────────────────────────────────────────────
    uint256 public mintPrice; // wei
    uint256 public nextTokenId;

    event CardMinted(address indexed minter, uint256 indexed id, string uri);

    // ─── ERC-721 storage ───────────────────────────────────────────────────
    mapping(uint256 => address) internal _ownerOf;
    mapping(address => uint256) internal _balanceOf;
    mapping(uint256 => address) public getApproved;
    mapping(address => mapping(address => bool)) public isApprovedForAll;
    mapping(uint256 => string) internal _tokenURIs;

    constructor(uint256 _mintPrice) {
        name = "BASE Airdrop Card";
        symbol = "BASECARD";
        mintPrice = _mintPrice;
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    // ─── Views ─────────────────────────────────────────────────────────────
    function ownerOf(uint256 id) public view returns (address o) {
        require((o = _ownerOf[id]) != address(0), "Not minted");
    }

    function balanceOf(address a) public view returns (uint256) {
        require(a != address(0), "Zero address");
        return _balanceOf[a];
    }

    function tokenURI(uint256 id) public view returns (string memory) {
        require(_ownerOf[id] != address(0), "Not minted");
        return _tokenURIs[id];
    }

    // ─── Approvals ─────────────────────────────────────────────────────────
    function approve(address spender, uint256 id) external {
        address o = _ownerOf[id];
        require(msg.sender == o || isApprovedForAll[o][msg.sender], "Not authorized");
        getApproved[id] = spender;
        emit Approval(o, spender, id);
    }

    function setApprovalForAll(address operator, bool approved) external {
        isApprovedForAll[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    // ─── Transfers ─────────────────────────────────────────────────────────
    function transferFrom(address from, address to, uint256 id) public {
        require(from == _ownerOf[id], "Wrong from");
        require(to != address(0), "Zero address");
        require(
            msg.sender == from ||
                isApprovedForAll[from][msg.sender] ||
                msg.sender == getApproved[id],
            "Not authorized"
        );

        unchecked {
            _balanceOf[from]--;
            _balanceOf[to]++;
        }
        _ownerOf[id] = to;
        delete getApproved[id];
        emit Transfer(from, to, id);
    }

    function safeTransferFrom(address from, address to, uint256 id) external {
        transferFrom(from, to, id);
        _checkReceiver(from, to, id, "");
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        bytes calldata data
    ) external {
        transferFrom(from, to, id);
        _checkReceiver(from, to, id, data);
    }

    function _checkReceiver(address from, address to, uint256 id, bytes memory data) internal {
        if (to.code.length != 0) {
            require(
                IERC721Receiver(to).onERC721Received(msg.sender, from, id, data) ==
                    IERC721Receiver.onERC721Received.selector,
                "Unsafe recipient"
            );
        }
    }

    // ─── Mint ──────────────────────────────────────────────────────────────
    // Public paid mint. Uses a plain mint (no onERC721Received callback) so it
    // never reverts for smart-contract wallets — e.g. Coinbase Smart Wallet /
    // Base app — which is exactly the audience here. The caller mints to itself.
    function mint(string calldata uri) external payable returns (uint256 id) {
        require(msg.value >= mintPrice, "Insufficient payment");
        id = nextTokenId++;
        _tokenURIs[id] = uri;
        unchecked {
            _balanceOf[msg.sender]++;
        }
        _ownerOf[id] = msg.sender;
        emit Transfer(address(0), msg.sender, id);
        emit CardMinted(msg.sender, id, uri);
    }

    // Mint several copies of the same card in ONE transaction (one wallet
    // confirmation). Pays mintPrice * quantity. Capped to keep gas bounded.
    function mintBatch(string calldata uri, uint256 quantity)
        external
        payable
        returns (uint256 firstId)
    {
        require(quantity > 0 && quantity <= 20, "Bad quantity");
        require(msg.value >= mintPrice * quantity, "Insufficient payment");
        firstId = nextTokenId;
        for (uint256 i = 0; i < quantity; i++) {
            uint256 id = nextTokenId++;
            _tokenURIs[id] = uri;
            _ownerOf[id] = msg.sender;
            emit Transfer(address(0), msg.sender, id);
            emit CardMinted(msg.sender, id, uri);
        }
        unchecked {
            _balanceOf[msg.sender] += quantity;
        }
    }

    // ─── Admin ─────────────────────────────────────────────────────────────
    function setMintPrice(uint256 _mintPrice) external onlyOwner {
        mintPrice = _mintPrice;
    }

    function withdraw(address payable to) external onlyOwner {
        (bool ok, ) = to.call{value: address(this).balance}("");
        require(ok, "Withdraw failed");
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    // ─── ERC-165 ───────────────────────────────────────────────────────────
    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return
            interfaceId == 0x01ffc9a7 || // ERC-165
            interfaceId == 0x80ac58cd || // ERC-721
            interfaceId == 0x5b5e139f; // ERC-721 Metadata
    }
}
