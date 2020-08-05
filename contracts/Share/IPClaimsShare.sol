pragma solidity ^0.4.23;

import "./IIPClaimsShare.sol";
import "../Upgradability/OwnableUpgradableImplementation/OwnableUpgradableImplementation.sol";
import "../TestContracts/Token/ERC20.sol";
import "../Oracle/TokenExchangeOracle.sol";
import "../../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../IPClaim/IPClaim.sol";


contract IPClaimsShare is IIPClaimsShare, OwnableUpgradableImplementation {

    using SafeMath for uint256;

    uint256 public feeInUSD; // fee in usd x 100
    address public feeReceiver;
    ERC20 public ipToken;
    TokenExchangeOracle public tokenExchangeOracle;

    struct Recipient {
        address addr; // recipient address
        bytes32 ndaHash; // hash of NDA uploaded to IPFS
    }

    // used to avoid duplicate sharing
    // bytes32 => keccak256(claim, recipient)
    mapping(bytes32 => bool) public sharedTo;

    // stores all shared IP claims along with their recipients
    // claim address => list of recipients
    mapping(address => Recipient[]) public recipientsPerClaim;

    // user address => list of claim addresses
    mapping(address => address[]) public claimsPerRecipient;

    /**
     * modifiers
     */

    modifier onlyValidAddress(address _address) {
        require(_address != address(0), "Invalid address");
        _;
    }

    /**
     * init
     */

    function initWithParameters(
        uint256 _feeInUSD,
        address _feeReceiver,
        address _ipToken,
        address _tokenExchangeOracle) public
    onlyValidAddress(_feeReceiver)
    onlyValidAddress(_ipToken)
    onlyValidAddress(_tokenExchangeOracle) {

        OwnableUpgradableImplementation.init();

        feeInUSD = _feeInUSD;
        feeReceiver = _feeReceiver;
        ipToken = ERC20(_ipToken);
        tokenExchangeOracle = TokenExchangeOracle(_tokenExchangeOracle);
    }

    /**
     * getters & setters
     */

    function getFeeInUSD() public view returns (uint256) {
        return feeInUSD;
    }

    function setFeeInUSD(uint256 _feeInUSD) public onlyOwner {
        feeInUSD = _feeInUSD;
    }

    function getFeeReceiver() public view returns (address) {
        return feeReceiver;
    }

    function setFeeReceiver(address _feeReceiver) public onlyOwner onlyValidAddress(_feeReceiver) {
        feeReceiver = _feeReceiver;
    }

    function getIPToken() public view returns (address) {
        return address(ipToken);
    }

    function setIPToken(address _ipToken) public onlyOwner onlyValidAddress(_ipToken) {
        ipToken = ERC20(_ipToken);
    }

    function getTokenExchangeOracle() public view returns (address) {
        return address(tokenExchangeOracle);
    }

    function setTokenExchangeOracle(address _tokenExchangeOracle) public onlyOwner onlyValidAddress(_tokenExchangeOracle) {
        tokenExchangeOracle = TokenExchangeOracle(_tokenExchangeOracle);
    }

    function shareIPClaim(address _claim, address _recipient, bytes32 _ndaHash) public
                onlyValidAddress(_claim) onlyValidAddress(_recipient) {

        require(msg.sender == IPClaim(_claim).owner(), "Not owner of IP claim");
        require(!IPClaim(_claim).isPublic(), "IP claim is not private");

        bytes32 hashedArgs = keccak256(abi.encodePacked(_claim, _recipient));

        require(!sharedTo[hashedArgs], "IP Claim already shared with the recipient");

        uint256 feeInTokens = tokenExchangeOracle.convertUSDToTokens(feeInUSD);

        if (feeInTokens > ipToken.allowance(msg.sender, address(this))) {
            feeInTokens = tokenExchangeOracle.convertUSDToTokensByLastRate(feeInUSD);
        }

        ipToken.transferFrom(msg.sender, feeReceiver, feeInTokens);

        sharedTo[hashedArgs] = true;

        recipientsPerClaim[_claim].push(Recipient({ addr: _recipient, ndaHash: _ndaHash }));

        claimsPerRecipient[_recipient].push(_claim);

        emit IPClaimShared(msg.sender, _claim, _recipient, _ndaHash, feeInTokens);
    }

    function getRecipientsCountPerClaim(address _claim) public view returns (uint256) {
        return recipientsPerClaim[_claim].length;
    }

    function getRecipientPerClaim(address _claim, uint8 _index) public view returns (address, bytes32) {
        return (recipientsPerClaim[_claim][_index].addr, recipientsPerClaim[_claim][_index].ndaHash);
    }

    function getClaimsCountPerRecipient(address _recipient) public view returns (uint256) {
        return claimsPerRecipient[_recipient].length;
    }

    function getClaimPerRecipient(address _recipient, uint8 _index) public view returns (address) {
        return claimsPerRecipient[_recipient][_index];
    }

}