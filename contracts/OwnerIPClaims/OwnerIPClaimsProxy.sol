pragma solidity ^0.4.23;

import "../Upgradability/Forwardable.sol";
import "../VaultitudeUpgradableImpls/IVaultitudeUpgradableImpls.sol";


contract OwnerIPClaimsProxy is Forwardable {

    address public vaultitudeUpgradableImpls;

    constructor(address _vaultitudeUpgradableImpls) public {
        vaultitudeUpgradableImpls = _vaultitudeUpgradableImpls;
    }

    function () payable public {
        address ownerIPClaimsImplAddress = IVaultitudeUpgradableImpls(vaultitudeUpgradableImpls).getOwnerIPClaimsAddress();
        delegatedFwd(ownerIPClaimsImplAddress);
    }

}