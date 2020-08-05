pragma solidity ^0.4.23;


contract IOwnerIPClaims {

    event RegistrySet(address _registry);
    event IPClaimSold(uint256 _claimId);

    function setRegistry(address _registry) public;
    function getRegistry() public view returns (address);
    function addNewClaim(address _claimAddress) public;
    function getClaimsCount() public view returns (uint32);
    function getClaim(uint256 _claimId) public view returns (address);
    function getIsClaimSold(uint256 _claimId) public view returns (bool);
    function setIsClaimSold(uint256 _claimId) public;

}