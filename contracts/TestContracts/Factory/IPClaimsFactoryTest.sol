pragma solidity ^0.4.23;
import "../../Upgradability/OwnableUpgradableImplementation/OwnableUpgradableImplementation.sol";
import "../Registry/IIPClaimsRegistryTest.sol";
import "./IIPClaimsFactoryTest.sol";
import "../../IPClaim/IPClaim.sol";
import "../Token/ERC20.sol";
import "../../Oracle/TokenExchangeOracle.sol";


contract IPClaimsFactoryTest is IIPClaimsFactoryTest, OwnableUpgradableImplementation {

    IIPClaimsRegistryTest public registry;
    ERC20 public ipToken;
    address public feeReceiver;
    TokenExchangeOracle public tokenExchangeOracle;

    /**
    * @param claimTypesPricesInUSDForCreate, hold the price for creating different types of claims as it follows:
    * @param claimTypesPricesInUSDForPublish, hold the price for publishing different types of claims as it follows:
    *
    * id_0 = Invention
    * id_1 = Media / Image
    * id_2 = Media / 3D Art
    * id_3 = Media / Design
    * id_4 = Document / Literary work
    * id_5 = Document / Code
    * id_6 = Research
    * id_7 = Trademark / Word
    * id_8 = Trademark / Figurative
    * id_9 = Trademark / Figurative with words
    * id_10 = Trademark / Shape
    * id_11 = Trademark / Shape with words
    * id_12 = Trademark / Sound
    * id_13 = File
    */
    uint256 public priceForCreatingPrivateClaim;
    uint256[] public claimTypesPricesInUSDForCreate;
    uint256[] public claimTypesPricesInUSDForPublish;

    /* new functionality */
    uint256 public testParam;

    modifier onlyValidAddress(address _address) {
        require(_address != address(0), "Invalid address");
        _;
    }

    function initWithParameters(
        address _registry,
        address _ipToken,
        address _feeReceiver,
        address _tokenExchangeOracle,
        uint256 _priceForCreatingPrivateClaim,
        uint256[] _claimTypesPricesInUSDForCreate,
        uint256[] _claimTypesPricesInUSDForPublish) public
    onlyValidAddress(_registry)
    onlyValidAddress(_ipToken)
    onlyValidAddress(_feeReceiver)
    onlyValidAddress(_tokenExchangeOracle) {

        OwnableUpgradableImplementation.init();

        registry = IIPClaimsRegistryTest(_registry);
        ipToken = ERC20(_ipToken);
        feeReceiver = _feeReceiver;
        tokenExchangeOracle = TokenExchangeOracle(_tokenExchangeOracle);
        priceForCreatingPrivateClaim = _priceForCreatingPrivateClaim;
        claimTypesPricesInUSDForCreate = _claimTypesPricesInUSDForCreate;
        claimTypesPricesInUSDForPublish = _claimTypesPricesInUSDForPublish;
    }

    function setRegistry(address _registry) public onlyOwner onlyValidAddress(_registry) {
        registry = IIPClaimsRegistryTest(_registry);
    }

    function getRegistry() public view returns (address) {
        return address(registry);
    }

    function setIPToken(address _ipToken) public onlyOwner onlyValidAddress(_ipToken) {
        ipToken = ERC20(_ipToken);
    }

    function getIPToken() public view returns (address) {
        return address(ipToken);
    }

    function setFeeReceiver(address _feeReceiver) public onlyOwner onlyValidAddress(_feeReceiver) {
        feeReceiver = _feeReceiver;
    }

    function getFeeReceiver() public view returns (address) {
        return feeReceiver;
    }

    function setTokenExchangeOracle(address _tokenExchangeOracle) public onlyOwner onlyValidAddress(_tokenExchangeOracle) {
        tokenExchangeOracle = TokenExchangeOracle(_tokenExchangeOracle);
    }

    function getTokenExchangeOracle() public view returns(address) {
        return address(tokenExchangeOracle);
    }

    function setPriceForCreatingPrivateClaim(uint256 _priceForCreatingPrivateClaim) public onlyOwner {
        priceForCreatingPrivateClaim = _priceForCreatingPrivateClaim;
    }

    function getPriceForCreatingPrivateClaim() public view returns (uint256) {
        return priceForCreatingPrivateClaim;
    }

    function setClaimTypesPricesInUSDForCreate(uint256[] _claimTypePricesInUSD) public onlyOwner {
        claimTypesPricesInUSDForCreate = _claimTypePricesInUSD;
    }

    function setSpecificClaimTypePriceInUSDForCreate(uint8 _typeID, uint256 _typePrice) public onlyOwner {
        claimTypesPricesInUSDForCreate[_typeID] = _typePrice;
    }

    function getSpecificClaimTypePriceInUSDForCreate(uint8 _typeID) public view returns (uint256) {
        return claimTypesPricesInUSDForCreate[_typeID];
    }

    function setClaimTypesPricesInUSDForPublish(uint256[] _claimTypePricesInUSDForPublish) public onlyOwner {
        claimTypesPricesInUSDForPublish = _claimTypePricesInUSDForPublish;
    }

    function setSpecificClaimTypePriceInUSDForPublish(uint8 _typeID, uint256 _typePrice) public onlyOwner {
        claimTypesPricesInUSDForPublish[_typeID] = _typePrice;
    }

    function getSpecificClaimTypePriceInUSDForPublish(uint8 _typeID) public view returns (uint256) {
        return claimTypesPricesInUSDForPublish[_typeID];
    }

    function getClaimTypesCount() public view returns (uint256) {
        return claimTypesPricesInUSDForCreate.length;
    }

    function createPrivateClaim(bytes32 _privateIPFSAddress, uint8 _claimType, bool _isPublic) public {
        require(!_isPublic);
        require(_privateIPFSAddress != bytes32(0));
        createClaim(_privateIPFSAddress, bytes32(0), _claimType, false);
    }

    function createPublicClaim(bytes32 _publicIPFSAddress, uint8 _claimType, bool _isPublic) public {
        require(_isPublic);
        require(_publicIPFSAddress != bytes32(0));
        createClaim(bytes32(0), _publicIPFSAddress, _claimType, true);
    }

    function publishClaim(address _claim, bytes32 _publicIPFSHash) public {
        require(IPClaim(_claim).owner() == msg.sender);
        require(!IPClaim(_claim).isPublic());

        uint8 claimType = IPClaim(_claim).claimType();

        uint256 claimPublishFeeInTokens = tokenExchangeOracle.convertUSDToTokens(claimTypesPricesInUSDForPublish[claimType]);

        if (claimPublishFeeInTokens > ipToken.allowance(msg.sender, this)) {
            claimPublishFeeInTokens = tokenExchangeOracle.convertUSDToTokensByLastRate(claimTypesPricesInUSDForPublish[claimType]);
        }

        ipToken.transferFrom(msg.sender, feeReceiver, claimPublishFeeInTokens);

        IPClaim(_claim).setToPublic(_publicIPFSHash);

        emit IPClaimPublished(_claim, _publicIPFSHash);
    }

    function createClaim(bytes32 _privateIPFSAddress, bytes32 _publicIPFSAddress, uint8 _claimType, bool _isPublic) internal {
        require(_claimType < claimTypesPricesInUSDForCreate.length, "there is no such claim type");

        uint256 claimRecordingFeeInUSD;

        if (_isPublic) {
            claimRecordingFeeInUSD = claimTypesPricesInUSDForCreate[_claimType];
        } else {
            claimRecordingFeeInUSD = priceForCreatingPrivateClaim;
        }

        uint256 claimRecordingFeeInTokens = tokenExchangeOracle.convertUSDToTokens(claimRecordingFeeInUSD);

        if (claimRecordingFeeInTokens > ipToken.allowance(msg.sender, this)) {
            claimRecordingFeeInTokens = tokenExchangeOracle.convertUSDToTokensByLastRate(claimRecordingFeeInUSD);
        }

        ipToken.transferFrom(msg.sender, feeReceiver, claimRecordingFeeInTokens);

        IPClaim claim = new IPClaim(msg.sender, _privateIPFSAddress, _publicIPFSAddress, _claimType, _isPublic,
            address(registry), address(this));
        registry.addNewClaim(msg.sender, claim);

        emit IPClaimCreated(msg.sender, claim);
    }

    /*
     * new functionality
     */

    function getTestParameter() public view returns (uint256) {
        return testParam;
    }

    function setTestParameter(uint256 _testParam) public {
        testParam = _testParam;
    }

}