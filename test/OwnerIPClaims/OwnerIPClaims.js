const IPClaim = artifacts.require("./IPClaim.sol");
const OwnerIPClaims = artifacts.require("./OwnerIPClaims.sol");
const IOwnerListOfClaims = artifacts.require("./IOwnerIPClaims.sol");
const IOwnerListOfClaimsTest = artifacts.require("./IOwnerIPClaimsTest.sol");
const OwnerListOfClaimsTest = artifacts.require("./OwnerIPClaimsTest.sol");
const ProjectInitializator = require("../ProjectInitializator");
const util = require("../util");
const MintableToken = artifacts.require("../TestContracts/Token/MintableToken.sol");
const TokenExchangeOracle = artifacts.require("./TokenExchangeOracle.sol");


contract("OwnerIPClaims", (accounts) => {

    const owner = accounts[0];
    const claimOwner = accounts[1];
    const oracleAdmin = accounts[2];
    const feeReceiver = accounts[8];
    const notOwner = accounts[9];

    const randomIPFS = "QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ";
    let ipfsToBS58 = util.getBytes32FromIpfsHash(randomIPFS);
    const amountToMint = "20000000000000000000"; // 20 ETH
    const exchangeRate = "226020";
    let priceForCreatingPrivateClaim = "1000";
    let typePrices = ["2000", "3000", "4000", "5000"];
    let typePricesForPublish = ["2000", "3000", "4000", "5000"];
    let claimType = "3";

    let factoryInstance;
    let registryInstance;
    let vaultitudeInstance;
    let tokenInstance;
    let transferInstance;
    let tokenExchangeOracle;

    let payment;

    beforeEach(async () => {
        factoryInstance = await ProjectInitializator.initIPClaimsFactory();
        registryInstance = await ProjectInitializator.initIPClaimsRegistry();
        tokenInstance = await MintableToken.new({from: owner});
        transferInstance = await ProjectInitializator.initIPClaimsTransfer(owner);
        tokenExchangeOracle = await TokenExchangeOracle.new(oracleAdmin, exchangeRate);

        await factoryInstance.initWithParameters(registryInstance.address, tokenInstance.address, feeReceiver, tokenExchangeOracle.address, priceForCreatingPrivateClaim, typePrices, typePricesForPublish, {from: owner});
        await registryInstance.initWithParameters(factoryInstance.address, transferInstance.address, {from: owner});

        vaultitudeInstance = await ProjectInitializator.initVaultitudeUpgradableImpls(owner);

        await registryInstance.setVaultitudeUpgradableImpls(vaultitudeInstance.address, {from: owner});

        let libraryInstance = await ProjectInitializator.initOwnerIPClaims();
        await vaultitudeInstance.setOwnerIPClaimsAddress(libraryInstance, {from: owner});

        payment = await tokenExchangeOracle.convertUSDToTokens(typePrices[claimType]);
        await tokenInstance.mint(claimOwner, amountToMint);
        await tokenInstance.approve(factoryInstance.address, payment, {from: claimOwner });

        await factoryInstance.createPublicClaim(ipfsToBS58, claimType, {from: claimOwner});
    });

    describe("Testing OwnerIPClaims initialization", () => {

        it("Should set initial properties of OwnerIPClaims list instance", async () => {
            let listOfClaimsAddress = await registryInstance.getOwnerIPClaims(claimOwner);
            let ownerListOfIPClaims = OwnerIPClaims.at(listOfClaimsAddress);

            let registryAddress = await ownerListOfIPClaims.getRegistry();
            let claimCount = await ownerListOfIPClaims.getClaimsCount();
            let isClaimSold = await ownerListOfIPClaims.getIsClaimSold(0);
            let getClaimAddr = await ownerListOfIPClaims.getClaim(0);
            let claim = IPClaim.at(getClaimAddr);
            let claimID = await claim.id();

            assert.strictEqual(registryAddress, registryInstance.address, "The registry address is not set correctly");
            assert.strictEqual(claimCount.toNumber(), 1, "The claimCount is not correct");
            assert.ok(!isClaimSold);
            assert.strictEqual(claimID.toNumber(), 0, "The claimCount is not correct");
        });

        it("Should NOT set registry address if already set", async () => {
            let listOfClaimsAddress = await registryInstance.getOwnerIPClaims(claimOwner);
            let ownerListOfIPClaims = OwnerIPClaims.at(listOfClaimsAddress);

            await util.expectThrow(ownerListOfIPClaims.setRegistry(notOwner, {from: owner}));
        });

        it("Should NOT add claim if not from registry", async () => {
            let listOfClaimsAddress = await registryInstance.getOwnerIPClaims(claimOwner);
            let ownerListOfIPClaims = OwnerIPClaims.at(listOfClaimsAddress);

            await util.expectThrow(ownerListOfIPClaims.addNewClaim(notOwner, {from: owner}));
        });

        it("Should NOT set isSold if not from registry", async () => {
            let listOfClaimsAddress = await registryInstance.getOwnerIPClaims(claimOwner);
            let ownerListOfIPClaims = OwnerIPClaims.at(listOfClaimsAddress);

            await util.expectThrow(ownerListOfIPClaims.setIsClaimSold(1), {from: notOwner});
        });
    });

    describe("Testing OwnerIPClaims upgradability", () => {

        it("Should keep data stored after upgrade", async () => {
            let listOfClaimsAddress = await registryInstance.getOwnerIPClaims(claimOwner);
            let ownerListOfIPClaims = await IOwnerListOfClaims.at(listOfClaimsAddress);

            let claimCount = await ownerListOfIPClaims.getClaimsCount();

            let ownerListOfClaimsTest = await OwnerListOfClaimsTest.new();

            await vaultitudeInstance.setOwnerIPClaimsAddress(ownerListOfClaimsTest.address, {from: owner});

            ownerListOfIPClaims = await IOwnerListOfClaimsTest.at(ownerListOfIPClaims.address);

            let claimCountAfter = await ownerListOfIPClaims.getClaimsCount();

            assert(claimCount.eq(claimCountAfter));
        });

        it("Should add new functionality", async () => {
            let testValue = 1234567890;

            let listOfClaimsAddress = await registryInstance.getOwnerIPClaims(claimOwner);
            let ownerListOfIPClaims = await IOwnerListOfClaims.at(listOfClaimsAddress);

            let ownerListOfClaimsTest = await OwnerListOfClaimsTest.new();
            await vaultitudeInstance.setOwnerIPClaimsAddress(ownerListOfClaimsTest.address, {from: owner});

            ownerListOfIPClaims = await IOwnerListOfClaimsTest.at(ownerListOfIPClaims.address);

            await ownerListOfIPClaims.setTestParameter(testValue);
            let _testValue = await ownerListOfIPClaims.getTestParameter();
            assert.strictEqual(testValue, _testValue.toNumber(), "the test value was not set corectly")
        });
    });

});