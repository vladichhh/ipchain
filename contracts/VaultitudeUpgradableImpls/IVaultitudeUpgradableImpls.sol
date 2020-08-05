pragma solidity ^0.4.0;

import "../Upgradability/OwnableUpgradableImplementation/IOwnableUpgradableImplementation.sol";


contract IVaultitudeUpgradableImpls is IOwnableUpgradableImplementation {

    event OwnerIPClaimsAddressSet(address indexed _ownerIPClaimsAddress);

    function setOwnerIPClaimsAddress(address _ownerIPClaimsAddress) public;
    function getOwnerIPClaimsAddress() public view returns (address);

}