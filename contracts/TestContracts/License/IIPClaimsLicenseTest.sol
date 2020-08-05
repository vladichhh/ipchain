pragma solidity ^0.4.23;

import "../../Upgradability/OwnableUpgradableImplementation/IOwnableUpgradableImplementation.sol";


contract IIPClaimsLicenseTest is IOwnableUpgradableImplementation {

    event LicenseRegistered(address indexed _claimOwner, address indexed _ipClaimLicenseReceiver, address indexed _claimAddress);

    function initWithParameters(uint256 _feeInUSD, uint8 _commissionPercentage, address _feeReceiver, address _ipToken,
        uint16 _minPeriod, uint16 _maxPeriod, address _ethExchangeOracle) public;
    function setFeeInUSD(uint256 _feeInUSD) public;
    function getFeeInUSD() public view returns (uint256);
    function setCommissionPercentage(uint8 _commissionPercentage) public;
    function getCommissionPercentage() public view returns (uint8);
    function setFeeReceiver(address _feeReceiver) public;
    function getFeeReceiver() public view returns (address);
    function setIPTokenAddress(address _token) public;
    function getIPTokenAddress() public view returns (address);
    function setMinPeriod(uint16 _minPeriod) public;
    function getMinPeriod() public view returns (uint16);
    function setMaxPeriod(uint16 _maxPeriod) public;
    function getMaxPeriod() public view returns (uint16);
    function setETHExchangeOracle(address _ethExchangeOracle) public;
    function getETHExchangeOracle() public view returns (address);
	function getNonce(address _claimAddress) public view returns (uint256);
    function registerLicenseWithEthers(address _ipClaimOwner, address _ipClaimAddress, uint256 _licensePriceInEthers,
        uint256 _days, bytes _signedDataByOwner) public payable;
    function getEndDateOfLicense(address _ipClaimAddress, address _licensee) public view returns (uint256);
	function getLicensesCountPerClaim(address _claimAddress) public view returns (uint256);
	function getLicensee(address _claimAddress, uint256 _index) public view returns (address);
    function getClaimCountPerLicensee(address _licenseeAddress) public view returns (uint256);
    function getLicenseeClaim(address _licenseeAddress, uint256 _index) public view returns (address);
	function recover(bytes32 _hash, bytes _signedDataByOwner) internal pure returns (address);

    /* new functionality */
    function setTestAddress(address _addr) public;
    function getTestAddress() public view returns (address);

}