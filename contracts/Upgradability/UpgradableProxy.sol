pragma solidity ^0.4.23;

import "./SharedStorage.sol";
import "./Forwardable.sol";


contract UpgradableProxy is SharedStorage, Forwardable {

    /**
    * @dev UpgradeableProxy is a proxy contract to a contract implementation. The implementation
    *      can update the reference, which effectively upgrades the contract
    * @param _contractImpl Address of the contract used as implementation
    */
    constructor(address _contractImpl) public {
        contractImplementation = _contractImpl;
    }

    /**
    * @dev All calls made to the proxy are forwarded to the contract implementation via a delegatecall
    * @return Any bytes32 value the implementation returns
    */
    function() public payable {
        delegatedFwd(contractImplementation);
    }

}