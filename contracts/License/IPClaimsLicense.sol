pragma solidity ^0.4.23;

import "../Upgradability/OwnableUpgradableImplementation/OwnableUpgradableImplementation.sol";
import "../../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../TestContracts/Token/ERC20.sol";
import "./IIPClaimsLicense.sol";
import "../ECRecover/ECTools.sol";
import "./../IPClaim/IPClaim.sol";
import "../Oracle/ETHExchangeOracle.sol";


contract IPClaimsLicense is IIPClaimsLicense, OwnableUpgradableImplementation {

    using SafeMath for uint256;

    // fee is kept multiplied by 100 -> 39.99USD = 3999
    uint256 public feeInUSD;
    uint32 public commissionPercentage;
    address public ipToken;
    address public feeReceiver;
    uint16 public minPeriod;
    uint16 public maxPeriod;
    ETHExchangeOracle public ethExchangeOracle;

    // IP Claim -> Claim licensee -> endDate
    mapping (address => mapping(address => uint256)) public claimToLicenseeToEndDate;

    // claim address -> nonce
    mapping (address => uint256) public claimToNonce;

    // claim address => addresses of licensees
    mapping(address => address[]) public licenseesPerClaim;

    // Licensee address => addresses of licenses
    mapping(address => address[]) public licensesPerLicensee;

    modifier onlyValidAddress(address _address) {
        require(_address != address(0), "Invalid address");
        _;
    }

    modifier onlyWithinValidPeriod(uint256 _days) {
        require(_days <= maxPeriod && _days >= minPeriod, "The period is not between three months and one year");
        _;
    }

    function initWithParameters(
        uint256 _feeInUSD,
        uint32 _commissionPercentage,
        address _feeReceiver,
        address _ipToken,
        uint16 _minPeriod,
        uint16 _maxPeriod,
        address _ethExchangeOracle) public
    onlyValidAddress(_feeReceiver)
    onlyValidAddress(_ipToken)
    onlyValidAddress(_ethExchangeOracle) {

        require(_minPeriod < _maxPeriod);

        OwnableUpgradableImplementation.init();

        feeInUSD = _feeInUSD;
        commissionPercentage = _commissionPercentage;
        feeReceiver = _feeReceiver;
        ipToken = _ipToken;
        minPeriod = _minPeriod;
        maxPeriod = _maxPeriod;
        ethExchangeOracle = ETHExchangeOracle(_ethExchangeOracle);
    }

    function setFeeInUSD(uint256 _feeInUSD) public onlyOwner {
        feeInUSD = _feeInUSD;
    }

    function getFeeInUSD() public view returns (uint256) {
        return feeInUSD;
    }

    function setCommissionPercentage(uint32 _commissionPercentage) public onlyOwner {
        commissionPercentage = _commissionPercentage;
    }

    function getCommissionPercentage() public view returns (uint32) {
        return commissionPercentage;
    }

    function setFeeReceiver(address _feeReceiver) public onlyOwner onlyValidAddress(_feeReceiver) {
        feeReceiver = _feeReceiver;
    }

    function getFeeReceiver() public view returns (address) {
        return feeReceiver;
    }

    function setIPTokenAddress(address _ipToken) public onlyOwner onlyValidAddress(_ipToken) {
        ipToken = _ipToken;
    }

    function getIPTokenAddress() public view returns (address) {
        return ipToken;
    }

    function setMinPeriod(uint16 _minPeriod) public onlyOwner {
        require(_minPeriod < maxPeriod);
        minPeriod = _minPeriod;
    }

    function getMinPeriod() public view returns (uint16) {
        return minPeriod;
    }

    function setMaxPeriod(uint16 _maxPeriod) public onlyOwner {
        require(minPeriod < _maxPeriod);
        maxPeriod = _maxPeriod;
    }

    function getMaxPeriod() public view returns (uint16) {
        return maxPeriod;
    }

    function setETHExchangeOracle(address _ethExchangeOracle) public onlyOwner onlyValidAddress(_ethExchangeOracle) {
        ethExchangeOracle = ETHExchangeOracle(_ethExchangeOracle);
    }

    function getETHExchangeOracle() public view returns (address) {
        return address(ethExchangeOracle);
    }

    function getNonce(address _claimAddress) public view returns (uint256) {
        return claimToNonce[_claimAddress];
    }

    /**
	* registerLicenseWithEthers - licence an address to use an intellectual property
	*
	* @param _ipClaimOwner - address of the claim owner
	* @param _ipClaimAddress - address of the IPCLaim contract
	* @param _licensePriceInWei - price that licensee should pay to claim owner in ethers
	* @param _days - period of the license in days
	* @param _signedDataByOwner - hash of the signed data /claim owner address, licensee address,
	*IPClaim address, price in ethers, days/s
	 */
    function registerLicenseWithEthers(
        address _ipClaimOwner,
        address _ipClaimAddress,
        uint256 _licensePriceInWei,
        uint256 _days,
        bytes _signedDataByOwner) public payable
    onlyValidAddress(_ipClaimOwner)
    onlyValidAddress(_ipClaimAddress)
    onlyWithinValidPeriod(_days) {

        uint256 platformFlatFeeInWei = ethExchangeOracle.convertUSDToWei(feeInUSD);

        if (msg.value < platformFlatFeeInWei.add(_licensePriceInWei)) {
            platformFlatFeeInWei = ethExchangeOracle.convertUSDToWeiByLastRate(feeInUSD);
            require(msg.value >= platformFlatFeeInWei.add(_licensePriceInWei), "not enough ethers");
        }

        bytes32 hashOfLicense = getHash(_ipClaimOwner, _ipClaimAddress, _licensePriceInWei, _days);
        address recoveredSigner = recover(hashOfLicense, _signedDataByOwner);

        require(IPClaim(_ipClaimAddress).owner() == recoveredSigner, "Claim owner is not the same");
        require(_ipClaimOwner == recoveredSigner, "Claim owner is not the same");

        extendLicense(_ipClaimAddress, _days);
        claimToNonce[_ipClaimAddress]++;

        // div(10000) because we multiply commission percentage by 100.
        uint256 platformPercentFeeInWei = (_licensePriceInWei.mul(commissionPercentage)).div(10000);
        uint256 amountForOwner = _licensePriceInWei.sub(platformPercentFeeInWei);

        recoveredSigner.transfer(amountForOwner);
        feeReceiver.transfer(msg.value.sub(amountForOwner));

        emit LicenseRegistered(_ipClaimOwner, msg.sender, _ipClaimAddress);
    }

    function getEndDateOfLicense(address _ipClaimAddress, address _licensee) public view returns (uint256) {
        return claimToLicenseeToEndDate[_ipClaimAddress][_licensee];
    }

    function getLicensesCountPerClaim(address _claimAddress) public view returns (uint256) {
        return licenseesPerClaim[_claimAddress].length;
    }

    function getLicensee(address _claimAddress, uint256 _index) public view returns (address) {
        return (licenseesPerClaim[_claimAddress][_index]);
    }

    function getClaimCountPerLicensee(address _licenseeAddress) public view returns (uint256) {
        return licensesPerLicensee[_licenseeAddress].length;
    }

    function getLicenseeClaim(address _licenseeAddress, uint256 _index) public view returns (address) {
        return (licensesPerLicensee[_licenseeAddress][_index]);
    }

    function recover(bytes32 _hash, bytes _signedDataByOwner) internal pure returns (address) {
        return ECTools.prefixedRecover(_hash, _signedDataByOwner);
    }

    function extendLicense(address _ipClaimAddress, uint256 _days) internal {
        if (claimToLicenseeToEndDate[_ipClaimAddress][msg.sender] == 0 || now > claimToLicenseeToEndDate[_ipClaimAddress][msg.sender]) {
            claimToLicenseeToEndDate[_ipClaimAddress][msg.sender] = (_days.mul(1 days)).add(now);
            licenseesPerClaim[_ipClaimAddress].push(msg.sender);
            licensesPerLicensee[msg.sender].push(_ipClaimAddress);
        } else {
            claimToLicenseeToEndDate[_ipClaimAddress][msg.sender] = (_days.mul(1 days)).add(claimToLicenseeToEndDate[_ipClaimAddress][msg.sender]);
        }
    }

    function getHash(address _ipClaimOwner, address _ipClaimAddress, uint256 _licensePriceInWei, uint256 _days) internal view returns (bytes32) {
        uint256 nonce = getNonce(_ipClaimAddress);
        return keccak256(abi.encodePacked(_ipClaimOwner, msg.sender, _ipClaimAddress, _licensePriceInWei, _days, nonce));
    }

}