pragma solidity ^0.4.23;

import "../Upgradability/OwnableUpgradableImplementation/OwnableUpgradableImplementation.sol";
import "../Registry/IIPClaimsRegistry.sol";
import "../TestContracts/Token/ERC20.sol";
import "./IIPClaimsTransfer.sol";
import "../ECRecover/ECTools.sol";
import "../../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./../IPClaim/IPClaim.sol";
import "../Oracle/ETHExchangeOracle.sol";
import "../Oracle/TokenExchangeOracle.sol";


contract IPClaimsTransfer is IIPClaimsTransfer, OwnableUpgradableImplementation {

    using SafeMath for uint256;

    address public registry;
    address public ipToken;
    address public feeReceiver;
    uint32 public commissionPercentage;
    uint32 public transferFeeInUSD;
    uint32 public freeTransferFeeInUSD;
    ETHExchangeOracle public ethExchangeOracle;
    TokenExchangeOracle public tokenExchangeOracle;

    modifier onlyValidAddress(address _address) {
        require(_address != address(0), "Invalid address");
        _;
    }

    modifier onlyClaimOwner(address _owner, address _claim) {
        require(_owner == IPClaim(_claim).owner(), "transaction not sent by claim owner");
        _;
    }
    
    function initWithParameters(
        address _registry,
        address _ipToken,
        address _feeReceiver,
        uint32 _commissionPercentage,
        uint32 _transferFeeInUSD,
        uint32 _freeTransferFeeInUSD,
        address _ethExchangeOracle,
        address _tokenExchangeOracle) public
    onlyValidAddress(_registry)
    onlyValidAddress(_ipToken)
    onlyValidAddress(_feeReceiver)
    onlyValidAddress(_ethExchangeOracle) {

        OwnableUpgradableImplementation.init();

        registry = _registry;
        ipToken = _ipToken;
        feeReceiver = _feeReceiver;
        commissionPercentage = _commissionPercentage;
        transferFeeInUSD = _transferFeeInUSD;
        freeTransferFeeInUSD = _freeTransferFeeInUSD;
        ethExchangeOracle = ETHExchangeOracle(_ethExchangeOracle);
        tokenExchangeOracle = TokenExchangeOracle(_tokenExchangeOracle);
    }

    function setRegistry(address _registry) public onlyOwner onlyValidAddress(_registry) {
        registry = _registry;
    }

    function getRegistry() public view returns (address) {
        return registry;
    }

    function setIPToken(address _ipToken) public onlyOwner onlyValidAddress(_ipToken) {
        ipToken = _ipToken;
    }

    function getIPToken() public view returns (address) {
        return ipToken;
    }

    function setFeeReceiver(address _feeReceiver) public onlyOwner onlyValidAddress(_feeReceiver) {
        feeReceiver = _feeReceiver;
    }

    function getFeeReceiver() public view returns (address) {
        return feeReceiver;
    }

    function setCommissionPercentage(uint32 _commissionPercentage) public onlyOwner {
        commissionPercentage = _commissionPercentage;
    }

    function getCommissionPercentage() public view returns (uint32) {
        return commissionPercentage;
    }

    function setFeeInUSD(uint32 _transferFeeInUSD) public onlyOwner {
        transferFeeInUSD = _transferFeeInUSD;
    }

    function getFeeInUSD() public view returns (uint32) {
        return transferFeeInUSD;
    }

    function setFreeTransferFeeInUSD(uint32 _freeTransferFeeInUSD) public onlyOwner {
        freeTransferFeeInUSD = _freeTransferFeeInUSD;
    }

    function getFreeTransferFeeInUSD() public view returns (uint32) {
        return freeTransferFeeInUSD;
    }

    function setETHExchangeOracle(address _ethExchangeOracle) public onlyOwner onlyValidAddress(_ethExchangeOracle) {
        ethExchangeOracle = ETHExchangeOracle(_ethExchangeOracle);
    }

    function getETHExchangeOracle() public view returns (address) {
        return address(ethExchangeOracle);
    }

    function setTokenExchangeOracle(address _tokenExchangeOracle) public onlyOwner onlyValidAddress(_tokenExchangeOracle) {
        tokenExchangeOracle = TokenExchangeOracle(_tokenExchangeOracle);
    }

    function getTokenExchangeOracle() public view returns (address) {
        return address(tokenExchangeOracle);
    }

    /**
     * Transfers a claim from owner to buyer with ethers.
     *
     * @param _ipClaimCurrentOwner - current owner of the claim
     * @param _ipClaimContractAddress - the address of the claim
     * @param _signedDataByOwner - hash of the signed data /seller, buyer, IPClaim address, amount in ethers/
     */
    function transferIPClaimWithEthers(
        address _ipClaimCurrentOwner,
        address _ipClaimContractAddress,
        uint256 _claimPrice,
        bytes _signedDataByOwner) public payable
    onlyValidAddress(_ipClaimContractAddress)
    onlyClaimOwner(_ipClaimCurrentOwner, _ipClaimContractAddress) {

        uint256 platformFlatFeeInWei = ethExchangeOracle.convertUSDToWei(transferFeeInUSD);

        if (msg.value < platformFlatFeeInWei.add(_claimPrice)) {
            platformFlatFeeInWei = ethExchangeOracle.convertUSDToWeiByLastRate(transferFeeInUSD);
            require(msg.value >= platformFlatFeeInWei.add(_claimPrice), "Transferred ethers not enough");
        }

        bytes32 bytes32Message = keccak256(abi.encodePacked(_ipClaimCurrentOwner, msg.sender, _ipClaimContractAddress, _claimPrice));
        address recoveredSigner = recover(bytes32Message, _signedDataByOwner);

        require(recoveredSigner == _ipClaimCurrentOwner, "Not signed by claim Owner");

        // div(10000) because we multiply commission percentage by 100.
        uint platformPercentEtherFee = (_claimPrice.mul(commissionPercentage)).div(10000);
        uint256 amountForOwner = _claimPrice.sub(platformPercentEtherFee);

        IIPClaimsRegistry(registry).changeOwnership(_ipClaimCurrentOwner, msg.sender, _ipClaimContractAddress);

        _ipClaimCurrentOwner.transfer(amountForOwner);
        feeReceiver.transfer(msg.value.sub(amountForOwner));

        emit OwnershipTransferredWithEthers(_ipClaimCurrentOwner, msg.sender, _ipClaimContractAddress, msg.value);
    }

    function transferIPClaimAsAGift(
        address _ipClaimRecipient,
        address _ipClaimContractAddress,
        bytes _signedDataByRecipient) public
    onlyValidAddress(_ipClaimContractAddress)
    onlyClaimOwner(msg.sender, _ipClaimContractAddress) {

        uint256 freeTransferFeeInTokens = tokenExchangeOracle.convertUSDToTokens(freeTransferFeeInUSD);

        if (freeTransferFeeInTokens > ERC20(ipToken).allowance(msg.sender, this)) {
            freeTransferFeeInTokens = tokenExchangeOracle.convertUSDToTokensByLastRate(freeTransferFeeInUSD);
        }

        bytes32 bytes32Message = keccak256(abi.encodePacked(_ipClaimContractAddress));
        address recoveredSigner = recover(bytes32Message, _signedDataByRecipient);

        require(recoveredSigner == _ipClaimRecipient, "Not approved by the buyer");

        IIPClaimsRegistry(registry).changeOwnership(msg.sender, recoveredSigner, _ipClaimContractAddress);

        ERC20(ipToken).transferFrom(msg.sender, feeReceiver, freeTransferFeeInTokens);

        emit OwnershipTransferredAsAGift(msg.sender, _ipClaimRecipient, _ipClaimContractAddress);
    }

    function recover(bytes32 _hash, bytes _signedDataByOwner) internal pure returns (address) {
        return ECTools.prefixedRecover(_hash, _signedDataByOwner);
    }

}