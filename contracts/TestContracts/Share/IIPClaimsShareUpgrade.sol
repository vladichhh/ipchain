pragma solidity ^0.4.23;

import "../../Upgradability/OwnableUpgradableImplementation/IOwnableUpgradableImplementation.sol";


contract IIPClaimsShareUpgrade is IOwnableUpgradableImplementation {

    event IPClaimShared(address indexed _owner, address indexed _claim, address indexed _recipient, bytes32 _ndaHash, uint256 _feeInTokens);

    function initWithParameters(uint256 _feeInUSD, address _feeReceiver, address _ipToken, address _tokenExchangeOracle) public;
    function getFeeInUSD() public view returns (uint256);
    function setFeeInUSD(uint256 _feeInUSD) public;
    function getFeeReceiver() public view returns (address);
    function setFeeReceiver(address _feeReceiver) public;
    function getIPToken() public view returns (address _ipToken);
    function setIPToken(address _ipToken) public;
    function getTokenExchangeOracle() public view returns (address);
    function setTokenExchangeOracle(address _tokenExchangeOracle) public;
    function shareIPClaim(address _claim, address _recipient, bytes32 _ndaHash) public;
    function getRecipientsCountPerClaim(address _claim) public view returns (uint256);
    function getRecipientPerClaim(address _claim, uint8 _index) public view returns (address, bytes32);
    function getClaimsCountPerRecipient(address _recipient) public view returns (uint256);
    function getClaimPerRecipient(address _recipient, uint8 _index) public view returns (address);

    /* new functionality */
    function getTestParameter() public view returns (address _testParameter);
    function setTestParameter(address _testParameter) public;

}