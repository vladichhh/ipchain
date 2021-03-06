pragma solidity ^0.4.23;

import "../Upgradability/OwnableUpgradableImplementation/OwnableUpgradableImplementation.sol";
import "./IIPClaimsRegistry.sol";
import "../OwnerIPClaims/OwnerIPClaimsProxy.sol";
import "../OwnerIPClaims/IOwnerIPClaims.sol";
import "../IPClaim/IPClaim.sol";


contract IPClaimsRegistry is IIPClaimsRegistry, OwnableUpgradableImplementation {

    address public factory;
    address public vaultitudeUpgradableImplsAddress;
    address public transferContract;

    mapping(address => address) public ownerIPClaimsContract;
    address[] public addressesOfIPClaimers;

    modifier onlyValidAddress(address _address) {
        require(_address != address(0), "Invalid address");
        _;
    }

    function initWithParameters(
        address _factory,
        address _transferContract) public
    onlyValidAddress(_factory)
    onlyValidAddress(_transferContract) {

        OwnableUpgradableImplementation.init();

        factory = _factory;
        transferContract = _transferContract;
    }

    function setVaultitudeUpgradableImpls(address _vaultitudeUpgradableImpls) public onlyOwner onlyValidAddress(_vaultitudeUpgradableImpls) {
        vaultitudeUpgradableImplsAddress = _vaultitudeUpgradableImpls;
    }

    function getVaultitudeUpgradableImpls() public view returns (address) {
        return vaultitudeUpgradableImplsAddress;
    }

    function setFactory(address _factory) public onlyOwner onlyValidAddress(_factory) {
        factory = _factory;
    }

    function getFactory() public view returns (address) {
        return factory;
    }

    function setTransferContract(address _transferContract) public onlyOwner onlyValidAddress(_transferContract) {
        transferContract = _transferContract;
    }

    function getTransferContract() public view returns (address) {
        return transferContract;
    }

    function getClaimersCount() public view returns (uint256) {
        return addressesOfIPClaimers.length;
    }

    function getClaimerAddress(uint256 _index) public view returns (address) {
        return addressesOfIPClaimers[_index];
    }

    function getOwnerIPClaims(address _claimOwner) public view returns (address) {
        return ownerIPClaimsContract[_claimOwner];
    }

    function changeOwnership(address _oldOwner, address _newOwner, address _ipClaimAddress) public {
        require(msg.sender == transferContract, "msg.sender is not the transfer contract address");

        uint256 claimID = IPClaim(_ipClaimAddress).id();
        IPClaim(_ipClaimAddress).changeOwner(_newOwner);
        IOwnerIPClaims(ownerIPClaimsContract[_oldOwner]).setIsClaimSold(claimID);

        registerClaim(_newOwner, _ipClaimAddress);

        emit OwnershipTransferred(_oldOwner, _newOwner);
    }

    function addNewClaim(address _claimOwner, address _claim) public {
        require(msg.sender == factory, "msg.sender is not the factory address");

        registerClaim(_claimOwner, _claim);
    }

    function registerClaim(address _claimOwner, address _claim) private {
        IOwnerIPClaims ownerIPClaims;

        if (ownerIPClaimsContract[_claimOwner] == address(0)) {
            OwnerIPClaimsProxy ownerIPClaimsProxy = new OwnerIPClaimsProxy(vaultitudeUpgradableImplsAddress);
            ownerIPClaims = IOwnerIPClaims(ownerIPClaimsProxy);
            ownerIPClaims.setRegistry(this);
            ownerIPClaimsContract[_claimOwner] = ownerIPClaims;
            addressesOfIPClaimers.push(_claimOwner);
        } else {
            ownerIPClaims = IOwnerIPClaims(ownerIPClaimsContract[_claimOwner]);
        }

        IPClaim(_claim).setId(ownerIPClaims.getClaimsCount());
        ownerIPClaims.addNewClaim(_claim);
    }

}