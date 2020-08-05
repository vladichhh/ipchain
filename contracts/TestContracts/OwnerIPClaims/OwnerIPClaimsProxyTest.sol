pragma solidity ^0.4.23;

import "../../Upgradability/Forwardable.sol";
import "../VaultitudeUpgradableImpls/IVaultitudeUpgradableImplsTest.sol";


contract OwnerIPClaimsProxyTest is Forwardable {

    address public vaultitudeUpgradableImpls;

    constructor(address _vaultitudeUpgradableImpls) public {
        vaultitudeUpgradableImpls = _vaultitudeUpgradableImpls;
    }

    function () payable public {
        address ownerIPClaimsImplAddress = IVaultitudeUpgradableImplsTest(vaultitudeUpgradableImpls).getOwnerIPClaimsAddress();
        delegatedFwd(ownerIPClaimsImplAddress);
    }

}