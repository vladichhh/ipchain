let IIPClaimsFactory = artifacts.require("./IIPClaimsFactory.sol");
let IPClaimsFactory = artifacts.require("./IPClaimsFactory.sol");
let IPClaimsFactoryProxy = artifacts.require("./IPClaimsFactoryProxy.sol");

let IPClaim = artifacts.require("./IPClaim.sol");
let ECTools = artifacts.require("./ECTools.sol");

let IOwnerIPClaims = artifacts.require("./IOwnerIPClaims.sol");
let OwnerIPClaims = artifacts.require("./OwnerIPClaims.sol");
let OwnerIPClaimsProxy = artifacts.require("./OwnerIPClaimsProxy.sol");

let IIPClaimsRegistry = artifacts.require("./IIPClaimsRegistry.sol");
let IPClaimsRegistry = artifacts.require("./IPClaimsRegistry.sol");
let IPClaimsRegistryProxy = artifacts.require("./IPClaimsRegistryProxy.sol");

let IVaultitudeUpgradableImpls = artifacts.require("./IVaultitudeUpgradableImpls.sol");
let VaultitudeUpgradableImpls = artifacts.require("./VaultitudeUpgradableImpls.sol");
let VaultitudeUpgradableImplsProxy = artifacts.require("./VaultitudeUpgradableImplsProxy.sol");

let IIPClaimsTransfer = artifacts.require("./IIPClaimsTransfer.sol");
let IPClaimsTransfer = artifacts.require("./IPClaimsTransfer.sol");
let IPClaimsTransferProxy = artifacts.require("./IPClaimsTransferProxy.sol");

let IIPClaimsLicense = artifacts.require("./IIPClaimsLicense.sol");
let IPClaimsLicense = artifacts.require("./IPClaimsLicense.sol");
let IPClaimsLicenseProxy = artifacts.require("./IPClaimsLicenseProxy.sol");

let IIPClaimsShare = artifacts.require("./IIPClaimsShare.sol");
let IPClaimsShare = artifacts.require("./IPClaimsShare.sol");
let IPClaimsShareProxy = artifacts.require("./IPClaimsShareProxy.sol");

let ProjectInitializator = (function () {

    let factoryContract;
    let registryContract;
    let ownerIPClaimsContract;
    let vaultitudeUpgradableImplsContract;
    let transferContract;
    let licenseContract;
    let shareContract;

    let initIPClaimsFactory = async () => {
        let factory = await IPClaimsFactory.new();
        let factoryProxy = await IPClaimsFactoryProxy.new(factory.address);
        factoryContract = await IIPClaimsFactory.at(factoryProxy.address);
        return factoryContract;
    };

    let initIPClaimsRegistry = async () => {
        let registry = await IPClaimsRegistry.new();
        let registryProxy = await IPClaimsRegistryProxy.new(registry.address);
        registryContract = await IIPClaimsRegistry.at(registryProxy.address);
        return registryContract;
    };

    let initOwnerIPClaims = async () => {
        let ownerIPClaims = await OwnerIPClaims.new();
        return ownerIPClaims.address;
    };

    let initVaultitudeUpgradableImpls = async () => {
        let vaultitudeUpgradableImpls = await VaultitudeUpgradableImpls.new();
        let vaultitudeUpgradableImplsProxy = await VaultitudeUpgradableImplsProxy.new(vaultitudeUpgradableImpls.address);
        vaultitudeUpgradableImplsContract = await IVaultitudeUpgradableImpls.at(vaultitudeUpgradableImplsProxy.address);
        await vaultitudeUpgradableImplsContract.init();
        return vaultitudeUpgradableImplsContract;
    };

    let initIPClaimsTransfer = async () => {
        let ecTools = await ECTools.new();
        IPClaimsTransfer.link("ECTools", ecTools.address);
        let ipClaimsTransfer = await IPClaimsTransfer.new();
        let ipClaimsTransferProxy = await IPClaimsTransferProxy.new(ipClaimsTransfer.address);
        transferContract = await IIPClaimsTransfer.at(ipClaimsTransferProxy.address);
        return transferContract;
    };

    let initIPClaimsLicense = async () => {
        let ecTools = await ECTools.new();
        IPClaimsLicense.link("ECTools", ecTools.address);
        let ipClaimsLicense = await IPClaimsLicense.new();
        let ipClaimsLicenseProxy = await IPClaimsLicenseProxy.new(ipClaimsLicense.address);
        licenseContract = await IIPClaimsLicense.at(ipClaimsLicenseProxy.address);
        return licenseContract;
    };
    
    let initIPClaimsShare = async () => {
        let ipClaimsShare = await IPClaimsShare.new();
        let ipClaimsShareProxy = await IPClaimsShareProxy.new(ipClaimsShare.address);
        shareContract = await IIPClaimsShare.at(ipClaimsShareProxy.address);
        return shareContract;
    };

    let getContracts = () => {
        return {
            factoryContract: factoryContract,
            registryContract: registryContract,
            ownerIPClaimsContract: ownerIPClaimsContract,
            vaultitudeUpgradableImplsContract: vaultitudeUpgradableImplsContract
        }
    };

    return {
        initIPClaimsFactory: initIPClaimsFactory,
        initIPClaimsRegistry: initIPClaimsRegistry,
        initOwnerIPClaims: initOwnerIPClaims,
        initVaultitudeUpgradableImpls: initVaultitudeUpgradableImpls,
        initIPClaimsTransfer: initIPClaimsTransfer,
        initIPClaimsLicense: initIPClaimsLicense,
        initIPClaimsShare: initIPClaimsShare,
        getContracts: getContracts
    }

})();

module.exports = ProjectInitializator;