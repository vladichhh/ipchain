pragma solidity ^0.4.23;

import '../Upgradability/UpgradableProxy.sol';


contract IPClaimsShareProxy is UpgradableProxy {

    constructor(address _contractImpl) UpgradableProxy(_contractImpl) public {}

}