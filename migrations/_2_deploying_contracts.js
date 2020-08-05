let IPClaimsFactory = artifacts.require("./IPClaimsFactory.sol");
let IPClaimsFactoryProxy = artifacts.require("./IPClaimsFactoryProxy.sol");
let IIPClaimsFactory = artifacts.require("./IIPClaimsFactory.sol");
let IIPClaimsRegistry = artifacts.require("./IIPClaimsRegistry.sol");
let IPClaimsRegistryProxy = artifacts.require("./IPClaimsRegistryProxy.sol");
let IPClaimsRegistry = artifacts.require("./IPClaimsRegistry.sol");
const VaultitudeUpgradableImpls = artifacts.require("./VaultitudeUpgradableImpls.sol");
const IVaultitudeUpgradableImpls = artifacts.require("./IVaultitudeUpgradableImpls.sol");
const VaultitudeUpgradableImplsProxy = artifacts.require("./VaultitudeUpgradableImplsProxy.sol");
const OwnerIPClaims = artifacts.require("./OwnerIPClaims.sol");


module.exports = async function (deployer) {

    let ipClaimsFactoryInstance;
    let ipClaimsRegistryInstance;
    let vaultitudeUpgradableImplsInstance;
    let ownerIPClaimsInstance;

    // Deploying Upgradable Factory.
    await deployer.deploy(IPClaimsFactory);
    let ipClaimsFactory = await IPClaimsFactory.deployed();
    await deployer.deploy(IPClaimsFactoryProxy, ipClaimsFactory.address);
    let ipClaimsFactoryProxy = await IPClaimsFactoryProxy.deployed();
    ipClaimsFactoryInstance = IIPClaimsFactory.at(ipClaimsFactoryProxy.address);

    // Deploying Upgradable Registry.
    await deployer.deploy(IPClaimsRegistry);
    let ipClaimsRegistry = await IPClaimsRegistry.deployed();
    await deployer.deploy(IPClaimsRegistryProxy, ipClaimsRegistry.address);
    let ipClaimsRegistryProxy = await IPClaimsRegistryProxy.deployed();
    ipClaimsRegistryInstance = IIPClaimsRegistry.at(ipClaimsRegistryProxy.address);

    // Deploying Upgradable Vaultitude Impls.
    await deployer.deploy(VaultitudeUpgradableImpls);
    let vaultitudeUpgradableImpls = await VaultitudeUpgradableImpls.deployed();
    await deployer.deploy(VaultitudeUpgradableImplsProxy, vaultitudeUpgradableImpls.address);
    let vaultitudeUpgradableImplsProxy = await VaultitudeUpgradableImplsProxy.deployed();
    vaultitudeUpgradableImplsInstance = IVaultitudeUpgradableImpls.at(vaultitudeUpgradableImplsProxy.address);

    // Deploying Upgradable Owner IPClaims.
    await deployer.deploy(OwnerIPClaims);
    let ownerIPClaims = await OwnerIPClaims.deployed();

    // Factory and Registry Init With Parameters.
    await ipClaimsFactoryInstance.initWithParameters(ipClaimsRegistryProxy.address);
    await ipClaimsRegistryInstance.initWithParameters(ipClaimsFactoryProxy.address);
    await ipClaimsRegistryInstance.setVaultitudeUpgradableImpls(vaultitudeUpgradableImplsProxy.address);

    // Init ownership of the vaultitudeUpgradableImplsInstance.
    await vaultitudeUpgradableImplsInstance.init();

    // set Owner IPClaims.
    await vaultitudeUpgradableImplsInstance.setOwnerIPClaimsAddress(ownerIPClaims.address);
};