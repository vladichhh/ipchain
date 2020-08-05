pragma solidity ^0.4.23;

import "../../Upgradability/OwnableUpgradableImplementation/IOwnableUpgradableImplementation.sol";


contract IIPClaimsFactoryTest is IOwnableUpgradableImplementation {

    event IPClaimCreated(address indexed _owner, address indexed _claimAddress);
    event IPClaimPublished(address _claim, bytes32 _publicIPFSHash);

    function initWithParameters(address _registry, address _ipToken, address _feeReceiver,
        address _tokenExchangeOracle, uint256 _priceForCreatingPrivateClaim,
        uint256[] _claimTypesPricesInUSDForCreate, uint256[] _claimTypesPricesInUSDForPublish) public;
    function setRegistry(address _registry) public;
    function getRegistry() public view returns (address);
    function setIPToken(address _ipTokenContractAddress) public;
    function getIPToken() public view returns (address);
    function setFeeReceiver(address _feeReceiver) public;
    function getFeeReceiver() public view returns (address);
    function setTokenExchangeOracle(address _tokenExchangeOracle) public;
    function getTokenExchangeOracle() public view returns(address);
    function setPriceForCreatingPrivateClaim(uint256 _priceForCreatingPrivateClaim) public;
    function getPriceForCreatingPrivateClaim() public view returns (uint256);
    function setClaimTypesPricesInUSDForCreate(uint256[] _claimTypePricesInUSD) public;
    function setSpecificClaimTypePriceInUSDForCreate(uint8 _typeID, uint256 _typePrice) public;
    function getSpecificClaimTypePriceInUSDForCreate(uint8) public view returns (uint256);
    function setClaimTypesPricesInUSDForPublish(uint256[] _claimTypePricesInUSDForPublish) public;
    function setSpecificClaimTypePriceInUSDForPublish(uint8 _typeID, uint256 _typePrice) public;
    function getSpecificClaimTypePriceInUSDForPublish(uint8 _typeID) public view returns (uint256);
    function getClaimTypesCount() public view returns (uint256);
    function createPrivateClaim(bytes32 _privateIPFSAddress, uint8 _claimType, bool _isPublic) public;
    function createPublicClaim(bytes32 _publicIPFSAddress, uint8 _claimType, bool _isPublic) public;
    function publishClaim(address _claim, bytes32 _publicIPFSHash) public;

    /* new functionality */
	function setTestParameter(uint256 _testParam) public;
	function getTestParameter() public view returns (uint256);

}