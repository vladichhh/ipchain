pragma solidity ^0.4.23;

import "../../Upgradability/OwnableUpgradableImplementation/OwnableUpgradableImplementation.sol";
import "./IVaultitudeUpgradableImplsTest.sol";


contract VaultitudeUpgradableImplsTest is IVaultitudeUpgradableImplsTest, OwnableUpgradableImplementation {

    address public ownerIPClaimsImplAddress;

    /* test functionality */
    uint256 public testParam;

    function setOwnerIPClaimsAddress(address _ownerIPClaimsImplAddress) public onlyOwner {
        require(_ownerIPClaimsImplAddress != address(0));
        ownerIPClaimsImplAddress = _ownerIPClaimsImplAddress;
        emit OwnerIPClaimsAddressSet(_ownerIPClaimsImplAddress);
    }

    function getOwnerIPClaimsAddress() public view returns (address) {
        return ownerIPClaimsImplAddress;
    }

    /*
     * new functionality
     */

    function getTestParam() public view returns (uint256 _testParam) {
        return testParam;
    }

    function setTestParam(uint256 _testParam) public {
        testParam = _testParam;
    }

}