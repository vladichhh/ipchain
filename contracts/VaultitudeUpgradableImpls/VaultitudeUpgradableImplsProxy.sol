pragma solidity ^0.4.0;

import "../Upgradability/UpgradableProxy.sol";


contract VaultitudeUpgradableImplsProxy is UpgradableProxy {

    constructor(address _contractImpl) UpgradableProxy(_contractImpl) public {}

}