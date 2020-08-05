pragma solidity ^0.4.23;

import "../Upgradability/OwnableUpgradableImplementation/IOwnableUpgradableImplementation.sol";


contract IIPClaimsTransfer is IOwnableUpgradableImplementation {

    event OwnershipTransferredWithEthers(address indexed _previousOwner, address indexed _newOwners,
        address indexed _claimAddress, uint _amountInEthers);
    event OwnershipTransferredWithTokens(address indexed _previousOwner, address indexed _newOwners,
        address indexed _claimAddress, uint _amountInTokens);
    event OwnershipTransferredAsAGift(address indexed _previousOwner, address indexed _newOwners,
        address indexed _claimAddress);

    function initWithParameters(address _registry, address _token, address _feeReceiver, uint32 _commissionPercentage,
        uint32 _transferFeeInUSD, uint32 _freeTransferFeeInUSD, address _ethExchangeOracle, address _tokenExchangeOracle) public;
    function setRegistry(address _registry) public;
    function getRegistry() public view returns (address);
    function setIPToken(address _ipToken) public;
    function getIPToken() public view returns (address);
    function setFeeReceiver(address _feeReceiver) public;
    function getFeeReceiver() public view returns (address);
    function setCommissionPercentage(uint32 _commissionPercentage) public;
    function getCommissionPercentage() public view returns (uint32);
    function setFeeInUSD(uint32 _feeInUSD) public;
    function getFeeInUSD() public view returns (uint32);
    function setFreeTransferFeeInUSD(uint32 _freeTransferFeeInUSD) public;
    function getFreeTransferFeeInUSD() public view returns (uint32);
    function setETHExchangeOracle(address _ethExchangeOracle) public;
    function getETHExchangeOracle() public view returns (address);
    function setTokenExchangeOracle(address _tokenExchangeOracle) public;
    function getTokenExchangeOracle() public view returns (address);
    function transferIPClaimWithEthers(address _ipClaimCurrentOwner, address _ipClaimContractAddress,
        uint256 _claimPrice, bytes _signedDataByOwner) public payable;
    function transferIPClaimAsAGift(address _ipClaimRecipient, address _ipClaimContractAddress,
        bytes _signedDataByRecipient) public;
    function recover(bytes32 _hash, bytes _sig) internal pure returns (address);

}