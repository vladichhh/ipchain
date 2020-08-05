pragma solidity ^0.4.0;

import "../../Upgradability/OwnableUpgradableImplementation/IOwnableUpgradableImplementation.sol";


contract IVaultitudeUpgradableImplsTest is IOwnableUpgradableImplementation {

    event OwnerIPClaimsAddressSet(address indexed _ownerIPClaimsAddress);

    function setOwnerIPClaimsAddress(address _ownerIPClaimsAddress) public;
    function getOwnerIPClaimsAddress() public view returns(address _ownerIPClaimsAddress);

    /* new functionality */
    function setTestParam(uint _testParam) public;
    function getTestParam() public view returns(uint _testParam);

}