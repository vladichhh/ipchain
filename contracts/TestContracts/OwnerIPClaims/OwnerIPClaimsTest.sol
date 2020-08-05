pragma solidity ^0.4.23;

import "./IOwnerIPClaimsTest.sol";
import "../../Upgradability/SharedStorage.sol";


contract OwnerIPClaimsTest is IOwnerIPClaimsTest, SharedStorage {

    address public registry;
    uint32 public lastClaimId;
    mapping (uint256 => address) public claims;
    mapping (uint256 => bool) public isClaimSold;

    /* new functionality */
    uint256 public testParameter;

    modifier onlyRegistry() {
        require(msg.sender == registry, "msg.sender is not the registry address");
        _;
    }

    function setRegistry(address _registry) public {
        require(registry == address(0), "The registry address was set");

        registry = _registry;

        emit RegistrySet(_registry);
    }

    function getRegistry() public view returns (address) {
        return registry;
    }

    function addNewClaim(address _claimAddress) public onlyRegistry {
        claims[lastClaimId] = _claimAddress;
        lastClaimId++;
    }

    function getClaimsCount() public view returns (uint32) {
        return lastClaimId;
    }

    function getClaim(uint256 _claimId) public view returns (address) {
        return claims[_claimId];
    }

    function getIsClaimSold(uint256 _claimId) public view returns (bool) {
        return isClaimSold[_claimId];
    }

    function setIsClaimSold(uint256 _claimId) public onlyRegistry {
        isClaimSold[_claimId] = true;

        emit IPClaimSold(_claimId);
    }

    /*
     * new functionality
     */

    function getTestParameter() public view returns(uint _testParameters) {
        return testParameter;
    }

    function setTestParameter(uint _testParam) public {
        testParameter = _testParam;
    }

}