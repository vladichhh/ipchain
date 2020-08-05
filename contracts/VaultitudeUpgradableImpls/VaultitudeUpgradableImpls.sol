pragma solidity ^0.4.23;

import "../Upgradability/OwnableUpgradableImplementation/OwnableUpgradableImplementation.sol";
import "./IVaultitudeUpgradableImpls.sol";


contract VaultitudeUpgradableImpls is IVaultitudeUpgradableImpls, OwnableUpgradableImplementation {

    address public ownerIPClaimsImplAddress;

    function setOwnerIPClaimsAddress(address _ownerIPClaimsImplAddress) public onlyOwner {
        require(_ownerIPClaimsImplAddress != address(0));
        ownerIPClaimsImplAddress = _ownerIPClaimsImplAddress;
        emit OwnerIPClaimsAddressSet(_ownerIPClaimsImplAddress);
    }

    function getOwnerIPClaimsAddress() public view returns (address) {
        return ownerIPClaimsImplAddress;
    }

}