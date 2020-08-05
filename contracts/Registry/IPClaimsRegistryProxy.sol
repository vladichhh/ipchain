pragma solidity ^0.4.23;

import "../Upgradability/UpgradableProxy.sol";


contract IPClaimsRegistryProxy is UpgradableProxy {

    constructor(address _contractImpl) UpgradableProxy(_contractImpl) public {}

}