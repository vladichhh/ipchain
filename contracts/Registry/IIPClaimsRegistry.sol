pragma solidity ^0.4.23;

import "../Upgradability/OwnableUpgradableImplementation/IOwnableUpgradableImplementation.sol";


contract IIPClaimsRegistry is IOwnableUpgradableImplementation {

    event OwnershipTransferred(address indexed _previousOwner, address indexed _newOwners);

    function initWithParameters(address _factory, address _transferContract) public;
    function setVaultitudeUpgradableImpls(address _vaultitudeUpgradableImpls) public;
    function getVaultitudeUpgradableImpls() public view returns (address);
    function setFactory(address _factory) public;
    function getFactory() public view returns (address);
    function setTransferContract(address _transferContract) public;
    function getTransferContract() public view returns (address);
    function getClaimersCount() public view returns (uint256);
    function getClaimerAddress(uint256 _index) public view returns (address);
    function getOwnerIPClaims(address _ipClaimOwner) public view returns (address);
    function changeOwnership(address _oldOwner, address _newOwner, address _ipClaimAddress) public;
    function addNewClaim(address _owner, address _claim) public;

}