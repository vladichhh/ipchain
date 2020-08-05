const etherlime = require("etherlime");
const utils = require('ethers').utils;

const config = require("./config");
const provider = require("./provider");

const IIPClaimsFactory = require("./../build/IIPClaimsFactory");
const IPClaimsFactory = require("./../build/IPClaimsFactory");
const IPClaimsFactoryProxy = require("./../build/IPClaimsFactoryProxy");

const IIPClaimsRegistry = require("./../build/IIPClaimsRegistry");
const IPClaimsRegistry = require("./../build/IPClaimsRegistry");
const IPClaimsRegistryProxy = require("./../build/IPClaimsRegistryProxy");

const IVaultitudeUpgradableImpls = require("./../build/IVaultitudeUpgradableImpls");
const VaultitudeUpgradableImpls = require("./../build/VaultitudeUpgradableImpls");
const VaultitudeUpgradableImplsProxy = require("./../build/VaultitudeUpgradableImplsProxy");

const OwnerIPClaims = require("./../build/OwnerIPClaims");

const IIPClaimsTransfer = require("./../build/IIPClaimsTransfer");
const IPClaimsTransfer = require("./../build/IPClaimsTransfer");
const IPClaimsTransferProxy = require("./../build/IPClaimsTransferProxy");

const IIPClaimsLicense = require("./../build/IIPClaimsLicense");
const IPClaimsLicense = require("./../build/IPClaimsLicense");
const IPClaimsLicenseProxy = require("./../build/IPClaimsLicenseProxy");

const IIPClaimsShare = require("./../build/IIPClaimsShare");
const IPClaimsShare = require("./../build/IPClaimsShare");
const IPClaimsShareProxy = require("./../build/IPClaimsShareProxy");

const ECTools = require("./../build/ECTools");

const ETHExchangeOracle = require("./../build/ETHExchangeOracle");
const TokenExchangeOracle = require("./../build/TokenExchangeOracle");

const defaultConfigs = {
    gasLimit: 5500000,
    gasPrice: 10000000000 // 10Gwei
};

/**
 *   IMPORTANT!!! set the fee receiver address and taxes
 */
const transferFeeInUSD = "1000"; // $10.00
const freeTransferFeeInUSD = "2000"; // $20.00

// commission percentage must be multiplied by 100
const transferCommissionPercentage = "750"; // 7.50%
const licenseCommissionPercentage = "750"; // 7.50%

const licenseFeeInUSD = "1000"; // $10.00
const licenseMinPeriod = "28"; // 28 days
const licenseMaxPeriod = "365"; // 365 days
const shareFeeInUSD = "3500"; // $35.00
const ethRate = "218080"; // 218.080
const tokenRate = "23500"; // 23.500

const oracleAdmin = "0xf5568294546e104cfcC95257D9b07eeDA6FA70ad";
const tokenInstance = "0xDcF90E91764336c5F488B18E1b9cB6A745A2979F";
const escrowLimepay = "0x78Be5dC8F02b41b0c3146D1b3Cabb31797060275";
const multiSigWalletInstance = "0x444403c1d73aa90bb0bba0225ac80083ad4550dc";

const priceForCreatingPrivateClaim = "2500"; // $25.00

/*
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

const claimTypesPricesInUSDForCreate = ["17500", "3500", "3500", "3500", "3500", "3500", "17500", "17500", "17500", "17500", "17500", "17500", "17500", "3500"];
const claimTypesPricesInUSDForPublish = ["15000", "1000", "1000", "1000", "1000", "1000", "15000", "15000", "15000", "15000", "15000", "15000", "15000", "1000"];

const deploy_1 = async (network, secret) => {

    const secretLoc = "fasdf";
    const networkLoc = "ropsten";

    let deployer = new etherlime.InfuraPrivateKeyDeployer(secretLoc, networkLoc, config.infuraAPIKey);
    deployer.defaultOverrides = defaultConfigs;

    let ecToolsInstance = await deployer.deploy(ECTools);

    let ethExchangeOracleInstance = await deployer.deploy(ETHExchangeOracle, {}, oracleAdmin, ethRate);
    let tokenExchangeOracleInstance = await deployer.deploy(TokenExchangeOracle, {}, oracleAdmin, tokenRate);

    let factory = await deployer.deploy(IPClaimsFactory);
    let factoryProxy = await deployer.deploy(IPClaimsFactoryProxy, {}, factory.contract.address);

    let registry = await deployer.deploy(IPClaimsRegistry);
    let registryProxy = await deployer.deploy(IPClaimsRegistryProxy, {}, registry.contract.address);

    let vaultitudeUpgradableImpls = await deployer.deploy(VaultitudeUpgradableImpls);
    let vaultitudeUpgradableImplsProxy = await deployer.deploy(VaultitudeUpgradableImplsProxy, {}, vaultitudeUpgradableImpls.contract.address);

    let ownerIPClaims = await deployer.deploy(OwnerIPClaims);

    let factoryInstance = deployer.wrapDeployedContract(IIPClaimsFactory, factoryProxy.contract.address);
    let registryInstance = deployer.wrapDeployedContract(IIPClaimsRegistry, registryProxy.contract.address);
    let vaultitudeUpgradableImplsInstance = deployer.wrapDeployedContract(IVaultitudeUpgradableImpls, vaultitudeUpgradableImplsProxy.contract.address);

    /*
     * IPClaimsFactory
     */
    let factoryInit = await factoryInstance.contract.initWithParameters(registryInstance.contract.address, tokenInstance, escrowLimepay,
        tokenExchangeOracleInstance.contract.address, priceForCreatingPrivateClaim, claimTypesPricesInUSDForCreate, claimTypesPricesInUSDForPublish, defaultConfigs);
    await factoryInstance.verboseWaitForTransaction(factoryInit, "Initiating factory with parameters");

    /*
     * IPClaimsTransfer
     */
    let ipClaimsTransfer = await deployer.deploy(IPClaimsTransfer, {"ECTools": ecToolsInstance.contract.address});
    let ipClaimsTransferProxy = await deployer.deploy(IPClaimsTransferProxy, {}, ipClaimsTransfer.contract.address);
    let ipClaimsTransferInstance = deployer.wrapDeployedContract(IIPClaimsTransfer, ipClaimsTransferProxy.contract.address);
    let ipClaimsTransferInit = await ipClaimsTransferInstance.contract.initWithParameters(registryInstance.contract.address,
            tokenInstance, escrowLimepay, transferCommissionPercentage, transferFeeInUSD, freeTransferFeeInUSD, ethExchangeOracleInstance.contract.address, defaultConfigs);
    await ipClaimsTransferInstance.verboseWaitForTransaction(ipClaimsTransferInit, "Initiating IPClaimsTransfer \ncontract with parameters");
    /*
     * IPClaimsRegistry
     */
    let registryInit = await registryInstance.contract.initWithParameters(factoryInstance.contract.address, ipClaimsTransferInstance.contract.address, defaultConfigs);
    await registryInstance.verboseWaitForTransaction(registryInit, "Initiating registry with parameters");

    let registrySetVaultUpgAddress = await registryInstance.contract.setVaultitudeUpgradableImpls(vaultitudeUpgradableImplsInstance.contract.address, defaultConfigs);
    await registryInstance.verboseWaitForTransaction(registrySetVaultUpgAddress, "set vaultitude upgradable \nimplementation address to registry");

    /*
     * VaultitudeUpgradableImpls
     */
    let vaultitudeUpgradableImplsInit = await vaultitudeUpgradableImplsInstance.contract.init(defaultConfigs);
    await vaultitudeUpgradableImplsInstance.verboseWaitForTransaction(vaultitudeUpgradableImplsInit, "Initiating the vaultitude upgradable \nimpls");

    let vaultitudeUpgradableImplsSetParam = await vaultitudeUpgradableImplsInstance.contract.setOwnerIPClaimsAddress(ownerIPClaims.contract.address, defaultConfigs);
    await vaultitudeUpgradableImplsInstance.verboseWaitForTransaction(vaultitudeUpgradableImplsSetParam, "set owner ipclaim address to \nvaultitude upgradable implementation \naddress");

    /*
     * IPClaimsLicense
     */
    let ipClaimsLicense = await deployer.deploy(IPClaimsLicense, {"ECTools": ecToolsInstance.contract.address});
    let ipClaimsLicenseProxy = await deployer.deploy(IPClaimsLicenseProxy, {}, ipClaimsLicense.contract.address);
    let ipClaimsLicenseInstance = deployer.wrapDeployedContract(IIPClaimsLicense, ipClaimsLicenseProxy.contract.address);
    let ipClaimsLicenseInstanceInit = await ipClaimsLicenseInstance.contract.initWithParameters(licenseFeeInUSD, licenseCommissionPercentage,
        escrowLimepay, tokenInstance, licenseMinPeriod, licenseMaxPeriod, ethExchangeOracleInstance.contract.address, defaultConfigs);
    await ipClaimsLicenseInstance.verboseWaitForTransaction(ipClaimsLicenseInstanceInit, "Initiating IPClaimsLicense contract");

    /*
     * IPClaimsShare
     */
    let ipClaimsShare = await deployer.deploy(IPClaimsShare);
    let ipClaimsShareProxy = await deployer.deploy(IPClaimsShareProxy, {}, ipClaimsShare.contract.address);
    let ipClaimsShareInstance = deployer.wrapDeployedContract(IIPClaimsShare, ipClaimsShareProxy.contract.address);
    let ipClaimsShareInstanceInit = await ipClaimsShareInstance.contract.initWithParameters(shareFeeInUSD, escrowLimepay,
            tokenInstance, tokenExchangeOracleInstance.contract.address, defaultConfigs);
    await ipClaimsShareInstance.verboseWaitForTransaction(ipClaimsShareInstanceInit, "Initiating IPClaimsShare contract");

    // Transfer Ownership

    let factoryTransferOwnership = await factoryInstance.transferOwnership(multiSigWalletInstance, defaultConfigs);
    await factoryInstance.verboseWaitForTransaction(factoryTransferOwnership, "Factory contract Transfer Ownership");

    let registryTransferOwnership = await registryInstance.transferOwnership(multiSigWalletInstance, defaultConfigs);
    await registryInstance.verboseWaitForTransaction(registryTransferOwnership, "Registry contract Transfer Ownership");

    let vaultitudeUpgradableImplsTransferOwnership = await vaultitudeUpgradableImplsInstance.transferOwnership(multiSigWalletInstance, defaultConfigs);
    await vaultitudeUpgradableImplsInstance.verboseWaitForTransaction(vaultitudeUpgradableImplsTransferOwnership, "VaultitudeUpgradableImpls contract Transfer Ownership");

    let transferContractTransferOwnership = await ipClaimsTransferInstance.transferOwnership(multiSigWalletInstance, defaultConfigs);
    await ipClaimsTransferInstance.verboseWaitForTransaction(transferContractTransferOwnership, "Transfer Contract Transfer Ownership");

    let licenseTransferOwnership = await ipClaimsLicenseInstance.transferOwnership(multiSigWalletInstance, defaultConfigs);
    await ipClaimsLicenseInstance.verboseWaitForTransaction(licenseTransferOwnership, "License contract Transfer Ownership");

    let shareTransferOwnership = await ipClaimsShareInstance.transferOwnership(multiSigWalletInstance, defaultConfigs);
    await ipClaimsShareInstance.verboseWaitForTransaction(shareTransferOwnership, "Share contract Transfer Ownership");

    let ethExchangeOracleTransferOwnership = await ethExchangeOracleInstance.transferOwnership(multiSigWalletInstance, defaultConfigs);
    await ethExchangeOracleInstance.verboseWaitForTransaction(ethExchangeOracleTransferOwnership, "Eth exchange oracle contract Transfer Ownership");

    let tokenExchangeOracleTransferOwnership = await tokenExchangeOracleInstance.transferOwnership(multiSigWalletInstance, defaultConfigs);
    await tokenExchangeOracleInstance.verboseWaitForTransaction(tokenExchangeOracleTransferOwnership, "Token exchange oracle contract Transfer Ownership");

};

module.exports = {
    deploy: deploy_1
};