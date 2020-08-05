const IPClaim = artifacts.require("./IPClaim.sol");
const IIPClaimsRegistryTest = artifacts.require("./IIPClaimsRegistryTest.sol");
const IPClaimsRegistryTest = artifacts.require("./IPClaimsRegistryTest.sol");
const ProjectInitializator = require("../ProjectInitializator");
const util = require("../util");
const MintableToken = artifacts.require("../TestContracts/Token/MintableToken.sol");
const TokenExchangeOracle = artifacts.require("./TokenExchangeOracle.sol");


contract("IPClaimsRegistry", (accounts) => {

    const owner = accounts[0];
    const claimOwner = accounts[1];
    const factory = accounts[2];
    const oracleAdmin = accounts[6];
    const feeReceiver = accounts[8];
    const notOwner = accounts[9];

    let priceForCreatingPrivateClaim = "1000";
    let typePrices = ["2000", "3000", "4000", "5000"];
    let typePricesForPublish = ["2000", "3000", "4000", "5000"];
    const exchangeRate = "226020";
    let claimType = "3";
    const amountToMint = "20000000000000000000"; // 20 ETH

    const randomIPFS = "QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ";
    let ipfsToBS58 = util.getBytes32FromIpfsHash(randomIPFS);
    let isPublic = false;

    let factoryInstance;
    let registryInstance;
    let vaultitudeInstance;
    let tokenInstance;
    let tokenExchangeOracle;
    let transferInstance;

    beforeEach(async () => {
        tokenInstance = await MintableToken.new({from: owner});
        tokenExchangeOracle = await TokenExchangeOracle.new(oracleAdmin, exchangeRate);
        factoryInstance = await ProjectInitializator.initIPClaimsFactory();
        registryInstance = await ProjectInitializator.initIPClaimsRegistry();
        transferInstance = await ProjectInitializator.initIPClaimsTransfer(owner);

        await factoryInstance.initWithParameters(registryInstance.address, tokenInstance.address, feeReceiver, tokenExchangeOracle.address, priceForCreatingPrivateClaim, typePrices, typePricesForPublish, {from: owner});
        await registryInstance.initWithParameters(factoryInstance.address, transferInstance.address, {from: owner});

        vaultitudeInstance = await ProjectInitializator.initVaultitudeUpgradableImpls(owner);

        await registryInstance.setVaultitudeUpgradableImpls(vaultitudeInstance.address, {from: owner});

        let libraryInstance = await ProjectInitializator.initOwnerIPClaims();

        await vaultitudeInstance.setOwnerIPClaimsAddress(libraryInstance, {from: owner});
    });

    describe("Testing registry initialization", () => {

        it("Should init registry instance", async () => {
            let _owner = await registryInstance.getOwner();
            let factoryAddress = await registryInstance.getFactory();

            assert.strictEqual(_owner, owner, "the owner is not set correctly");
            assert.strictEqual(factoryAddress, factoryInstance.address, "the factory address is not set correctly");
        });

        it("Should NOT init if already inited", async () => {
            await util.expectThrow(registryInstance.init({from: owner}));
            await util.expectThrow(registryInstance.initWithParameters(factoryInstance.address, transferInstance.address, {from: owner}));
        });

        it("Should set factory address from owner", async () => {
            await registryInstance.setFactory(notOwner, {from: owner});
            let newVaultitudeImpls = await registryInstance.getFactory({from: owner});

            assert.strictEqual(newVaultitudeImpls, notOwner, "");
        });

        it("Should NOT set factory address if NOT owner", async () => {
            await util.expectThrow(registryInstance.setFactory(notOwner, {from: notOwner}));
        });

        it("Should set cLaim transfering contract address from owner", async () => {
            await registryInstance.setTransferContract(notOwner, {from: owner});
            let newClaimTransferringContractAddress = await registryInstance.getTransferContract({from: owner});

            assert.strictEqual(newClaimTransferringContractAddress, notOwner, "");
        });

        it("Should NOT set cLaim transfering contract address address if NOT owner", async () => {
            await util.expectThrow(registryInstance.setTransferContract(notOwner, {from: notOwner}));
        });

        it("Should set Vaultitude implementations from owner", async () => {
            await registryInstance.setVaultitudeUpgradableImpls(notOwner, {from: owner});

            let newVaultitudeImpls = await registryInstance.getVaultitudeUpgradableImpls({from: owner});

            assert.strictEqual(newVaultitudeImpls, notOwner, "");
        });

        it("Should NOT set Vaultitude implementations if NOT owner", async () => {
            await util.expectThrow(registryInstance.setVaultitudeUpgradableImpls(notOwner, {from: notOwner}));
        });

        it("Should create a claim", async () => {
            let ipClaim = await IPClaim.new(owner, ipfsToBS58, ipfsToBS58, claimType, isPublic, registryInstance.address, factoryInstance.address);
            await registryInstance.setFactory(factory, {from: owner});
            await registryInstance.addNewClaim(claimOwner, ipClaim.address, {from: factory});
            let listOfIPClaims = await registryInstance.getOwnerIPClaims(claimOwner);

            assert(listOfIPClaims != 0x0, "");
        });

        it("Should return number of all claimers", async () => {
            let firstIPClaim = await IPClaim.new(owner, ipfsToBS58, ipfsToBS58, claimType, isPublic, registryInstance.address, factoryInstance.address);
            let secondIPClaim = await IPClaim.new(notOwner, ipfsToBS58, ipfsToBS58, claimType, isPublic, registryInstance.address, factoryInstance.address);
            await registryInstance.setFactory(factory, {from: owner});

            await registryInstance.addNewClaim(claimOwner, firstIPClaim.address, {from: factory});

            await registryInstance.addNewClaim(notOwner, secondIPClaim.address, {from: factory});

            let claimersCount = await registryInstance.getClaimersCount();
            let listOfIPClaims = await registryInstance.getOwnerIPClaims(claimOwner);

            assert.strictEqual(claimersCount.toNumber(), 2, "");
            assert(listOfIPClaims != 0x0, "");
        });

        it("Should return claimer addresses", async () => {
            let firstIPClaim = await IPClaim.new(owner, ipfsToBS58, ipfsToBS58, claimType, isPublic, registryInstance.address, factoryInstance.address);
            let secondIPClaim = await IPClaim.new(notOwner, ipfsToBS58,ipfsToBS58,  claimType, isPublic, registryInstance.address, factoryInstance.address);

            await registryInstance.setFactory(factory, {from: owner});

            await registryInstance.addNewClaim(claimOwner, firstIPClaim.address, {from: factory});

            await registryInstance.addNewClaim(notOwner, secondIPClaim.address, {from: factory});

            let firstClaimer = await registryInstance.getClaimerAddress(0);
            let SecondClaimer = await registryInstance.getClaimerAddress(1);

            assert.strictEqual(claimOwner, firstClaimer, "");
            assert.strictEqual(notOwner, SecondClaimer, "");
        });

        it("Should NOT create a claim if not from factory", async () => {
            let ipClaim = await IPClaim.new(owner, ipfsToBS58, ipfsToBS58, claimType, isPublic, registryInstance.address, factoryInstance.address);

            await util.expectThrow(registryInstance.addNewClaim(claimOwner, ipClaim.address, {from: notOwner}));
        });

        it("Should register the same claim twice", async () => {
            let ipClaim = await IPClaim.new(owner, ipfsToBS58, ipfsToBS58, claimType, isPublic, registryInstance.address, factoryInstance.address);
            await registryInstance.setFactory(factory, {from: owner});
            await registryInstance.addNewClaim(claimOwner, ipClaim.address, {from: factory});
            await registryInstance.addNewClaim(claimOwner, ipClaim.address, {from: factory});
        });
    });

    describe("Testing registry upgradability", () => {

        it("Should keep data stored after upgrade", async () => {

            payment = await tokenExchangeOracle.convertUSDToTokens(typePrices[claimType]);
            await tokenInstance.mint(claimOwner, amountToMint);
            await tokenInstance.approve(factoryInstance.address, payment, {from: claimOwner });

            let ownerBeforeUpgrade = await registryInstance.getOwner();
            let registryImplBefore = await registryInstance.getImplementation();
            let vaultitudeImplsBefore = await registryInstance.getVaultitudeUpgradableImpls();

            await factoryInstance.createPrivateClaim(ipfsToBS58, claimType, {from: claimOwner});

            let listOfIPClaimsBefore = await registryInstance.getOwnerIPClaims(claimOwner);

            let registryClaimsTest = await IPClaimsRegistryTest.new({from: owner});

            await registryInstance.upgradeImplementation(registryClaimsTest.address, {from: owner});

            registryInstance = await IIPClaimsRegistryTest.at(registryInstance.address);

            let claimCount = await registryInstance.getClaimersCount();

            await tokenInstance.mint(notOwner, amountToMint);
            await tokenInstance.approve(factoryInstance.address, payment, {from: notOwner});
            await factoryInstance.createPrivateClaim(ipfsToBS58, claimType, {from: notOwner});

            let ownerAfterUpgrade = await registryInstance.getOwner();
            let registryImplAfter = await registryInstance.getImplementation();
            let factoryAddress = await registryInstance.getFactory();
            let vaultitudeImplsAfter = await registryInstance.getVaultitudeUpgradableImpls();
            let listOfIPClaimsAfter = await registryInstance.getOwnerIPClaims(claimOwner);
            let claimCountAfter = await registryInstance.getClaimersCount();

            assert.strictEqual(ownerBeforeUpgrade, ownerAfterUpgrade, "claim owner is not upgraded correctly");
            assert.notEqual(registryImplBefore, registryImplAfter, "registry implementation addresses should not match");
            assert.strictEqual(factoryAddress, factoryInstance.address, "factory address is not correctly");
            assert.strictEqual(vaultitudeImplsBefore, vaultitudeImplsAfter, "vaultitudeImpls address is not correctly");
            assert.strictEqual(listOfIPClaimsAfter, listOfIPClaimsBefore, "list of IPClaims address is not correctly");
            assert.strictEqual(claimCount.toNumber(), 1);
            assert.strictEqual(claimCountAfter.toNumber(), 2);
        });

        it("Should add new functionality", async () => {
            let testValue = 1234567890;

            let registryClaimsTest = await IPClaimsRegistryTest.new({from: owner});
            await registryInstance.upgradeImplementation(registryClaimsTest.address, {from: owner});
            registryInstance = await IIPClaimsRegistryTest.at(registryInstance.address);

            await registryInstance.setTestParameter(testValue);

            let _testValue = await registryInstance.getTestParameter();

            assert.strictEqual(testValue, _testValue.toNumber(), "the test value is not set correct")
        });

        it("Should NOT upgrade if not from owner", async () => {
            let registryClaimsTest = await IPClaimsRegistryTest.new();
            await util.expectThrow(registryInstance.upgradeImplementation(registryClaimsTest.address, {from: notOwner}));
        });

    });

});