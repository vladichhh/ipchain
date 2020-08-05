const IPClaim = artifacts.require("./IPClaim.sol");
const OwnerIPClaims = artifacts.require("./OwnerIPClaims.sol");
const IIPClaimsFactoryTest = artifacts.require("./IIPClaimsFactoryTest.sol");
const IPClaimsFactoryTest = artifacts.require("./IPClaimsFactoryTest.sol");
const ProjectInitializator = require("../ProjectInitializator");
const util = require("../util");
const MintableToken = artifacts.require("../TestContracts/Token/MintableToken.sol");
const TokenExchangeOracle = artifacts.require("./TokenExchangeOracle.sol");


contract("IPClaimsFactory", (accounts) => {

    const owner = accounts[0];
    const claimOwner = accounts[1];
    const oracleAdmin = accounts[2];
    const feeReceiver = accounts[8];
    const notOwner = accounts[9];

    const privateRandomIPFS = "QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ";
    const publicRandomIPFS = "QmRAQB6YaCyidP37UdDnjFY5vQuiBrcqdyoW1CuDgwxkD4";
    const emptyIPFSAddress = "0x0000000000000000000000000000000000000000000000000000000000000000";
    let privateIPFS = util.getBytes32FromIpfsHash(privateRandomIPFS);
    let publicIPFS = util.getBytes32FromIpfsHash(publicRandomIPFS);
    const amountToMint = "1000000000000000000000"; // 20 ETH
    let priceForCreatingPrivateClaim = "2500";
    let typePricesForCreate = ["17500", "3500", "3500", "3500", "3500", "3500", "17500", "17500", "17500", "17500", "17500", "17500", "17500", "3500"];
    let typePricesForPublish = ["15000", "1000", "1000", "1000", "1000", "1000", "15000", "15000", "15000", "15000", "15000", "15000", "15000", "1000"];
    let typePricesNew = ["6000", "7000", "8000", "9000", "10000", "11000"];
    const claimType = "3";
    const exchangeRate = "23500";
    let payment;

    let factoryInstance;
    let registryInstance;
    let vaultitudeUpgradableImplsInstance;
    let tokenInstance;
    let transferInstance;
    let tokenExchangeOracle;
    let claim;

    beforeEach(async () => {
        factoryInstance = await ProjectInitializator.initIPClaimsFactory();
        registryInstance = await ProjectInitializator.initIPClaimsRegistry();
        tokenInstance = await MintableToken.new({from: owner});
        tokenExchangeOracle = await TokenExchangeOracle.new(oracleAdmin, exchangeRate);
        transferInstance = await ProjectInitializator.initIPClaimsTransfer(owner);

        await factoryInstance.initWithParameters(registryInstance.address, tokenInstance.address, feeReceiver,
            tokenExchangeOracle.address, priceForCreatingPrivateClaim, typePricesForCreate, typePricesForPublish, {from: owner});

        await registryInstance.initWithParameters(factoryInstance.address, transferInstance.address, {from: owner});

        vaultitudeUpgradableImplsInstance = await ProjectInitializator.initVaultitudeUpgradableImpls(owner);

        await registryInstance.setVaultitudeUpgradableImpls(vaultitudeUpgradableImplsInstance.address, {from: owner});

        let libraryInstance = await ProjectInitializator.initOwnerIPClaims();

        await vaultitudeUpgradableImplsInstance.setOwnerIPClaimsAddress(libraryInstance, {from: owner});

        await tokenInstance.mint(claimOwner, amountToMint);
    });

    describe("Testing factory initialization", () => {

        it("Should init and set registry address", async () => {
            let _owner = await factoryInstance.getOwner();
            let registryAddress = await factoryInstance.getRegistry();
            let _tokenInstance = await factoryInstance.getIPToken();
            let _feeReceiver = await factoryInstance.getFeeReceiver();
            let _tokenExchangeOracle = await factoryInstance.getTokenExchangeOracle();
            let _priceForCreatingPrivateClaim = await factoryInstance.getPriceForCreatingPrivateClaim();
            let _claimTypesPricesInUSDForCreate = await factoryInstance.getSpecificClaimTypePriceInUSDForCreate(3);
            let _claimTypesPricesInUSDForPublish = await factoryInstance.getSpecificClaimTypePriceInUSDForPublish(2);


            assert.strictEqual(_owner, owner, "the owner is not set correctly");
            assert.strictEqual(registryAddress, registryInstance.address, "the registry is not set correctly");
            assert.strictEqual(_tokenInstance, tokenInstance.address, "token contract is not set correctly");
            assert.strictEqual(_feeReceiver, feeReceiver, "the fee receiver is not set correctly");
            assert.strictEqual(_tokenExchangeOracle, tokenExchangeOracle.address, "token exchange oracle is not set");
            assert.strictEqual(_priceForCreatingPrivateClaim.toString(), priceForCreatingPrivateClaim, "price for creating private claim is not set");
            assert.strictEqual(_claimTypesPricesInUSDForCreate.toString(), typePricesForCreate[3], "typePricesForCreate not set");
            assert.strictEqual(_claimTypesPricesInUSDForPublish.toString(), typePricesForPublish[2], "typePricesForPublish not set");
        });

        it("Should NOT init if inited", async () => {
            await util.expectThrow(factoryInstance.initWithParameters(registryInstance.address, tokenInstance.address, feeReceiver, tokenExchangeOracle.address, priceForCreatingPrivateClaim, typePricesForCreate, typePricesForPublish, {from: owner}));
        });

        it("Should set registry address from Owner", async () => {
            await factoryInstance.setRegistry(notOwner, {from: owner});
            let newRegistryInstance = await factoryInstance.getRegistry({from: owner});
            assert.strictEqual(newRegistryInstance, notOwner, "the registry instance address was not changed correctly")
        });

        it("Should NOT set registry address if not from Owner", async () => {
            await util.expectThrow(factoryInstance.setRegistry(registryInstance.address, {from: notOwner}));
        });

        it("Should NOT set empty registry address", async () => {
            await util.expectThrow(factoryInstance.setRegistry("", {from: owner}));
        });

        it("Should set token address from Owner", async () => {
            await factoryInstance.setIPToken(notOwner, {from: owner});
            let newTokenInstance = await factoryInstance.getIPToken({from: owner});
            assert.strictEqual(newTokenInstance, notOwner, "the token instance address was not changed correctly")
        });

        it("Should NOT set token address if not from Owner", async () => {
            await util.expectThrow(factoryInstance.setIPToken(notOwner, {from: notOwner}));
        });

        it("Should NOT set empty token address", async () => {
            await util.expectThrow(factoryInstance.setIPToken("", {from: owner}));
        });

        it("Should set feeReceiver address from Owner", async () => {
            await factoryInstance.setFeeReceiver(notOwner, {from: owner});
            let newFeeReceiver = await factoryInstance.getFeeReceiver();
            assert.strictEqual(newFeeReceiver, notOwner, "the fee reseiver address was not changed correctly")
        });

        it("Should NOT set feeReceiver address if not from Owner", async () => {
            await util.expectThrow(factoryInstance.setFeeReceiver(notOwner, {from: notOwner}));
        });

        it("Should NOT set empty feeReceiver address", async () => {
            await util.expectThrow(factoryInstance.setFeeReceiver("", {from: owner}));
        });

        it("Should change private claim creating fee from Owner", async () => {
            let newPriceForCreatingPrivate = 4234;
            await factoryInstance.setPriceForCreatingPrivateClaim(newPriceForCreatingPrivate, {from: owner});
            let claimRecordingFee = await factoryInstance.getPriceForCreatingPrivateClaim();
            assert.strictEqual(claimRecordingFee.toNumber(), newPriceForCreatingPrivate, "private claim recording fee was not set correctly")
        });

        it("Should NOT change private claims recording fee if not from Owner", async () => {
            let newPriceForCreatingPrivate = 4234;
            await util.expectThrow(factoryInstance.setPriceForCreatingPrivateClaim(newPriceForCreatingPrivate, {from: notOwner}));
        });

        it("Should change claim creating fee from Owner", async () => {
            let typeID = 1;
            await factoryInstance.setClaimTypesPricesInUSDForCreate(typePricesNew, {from: owner});
            let claimRecordingTokenFee = await factoryInstance.getSpecificClaimTypePriceInUSDForCreate(typeID, {from: owner});
            assert.strictEqual(claimRecordingTokenFee.toString(), typePricesNew[typeID], "the claim creating fee was not changed correctly")
        });

        it("Should NOT change claims publish token fee if not from Owner", async () => {
            await util.expectThrow(factoryInstance.setClaimTypesPricesInUSDForCreate(typePricesNew, {from: notOwner}));
        });

        it("Should change claim publish fee from Owner", async () => {
            let typeID = 1;
            await factoryInstance.setClaimTypesPricesInUSDForPublish(typePricesNew, {from: owner});
            let claimRecordingTokenFee = await factoryInstance.getSpecificClaimTypePriceInUSDForPublish(typeID, {from: owner});
            assert.strictEqual(claimRecordingTokenFee.toString(), typePricesNew[typeID], "claim publish fee was not changed correctly")
        });

        it("Should NOT change claims publish fee if not from Owner", async () => {
            await util.expectThrow(factoryInstance.setClaimTypesPricesInUSDForPublish(typePricesNew, {from: notOwner}));
        });

        it('should return the count of claim types', async () => {
            let typeCount = await factoryInstance.getClaimTypesCount();
            assert.equal(typeCount, typePricesForCreate.length)
        });
    });

    describe("Testing transfer factory ownership", () => {
        it("Should transfer ownership", async () => {
            await factoryInstance.transferOwnership(notOwner, {from: owner});
        });

        it("Should not transfer ownership if empty newOwner address", async () => {
            await util.expectThrow(factoryInstance.transferOwnership("0x0", {from: owner}));
        });
    });

    describe("Testing creation of a claim", () => {

        it("Should create PRIVATE claim", async () => {
            let isPublic = false;
            payment = await tokenExchangeOracle.convertUSDToTokens(priceForCreatingPrivateClaim);
            await tokenInstance.approve(factoryInstance.address, payment, {from: claimOwner });

            await factoryInstance.createPrivateClaim(privateIPFS, claimType, {from: claimOwner});
            let timeNow = web3.eth.getBlock(web3.eth.blockNumber).timestamp;

            let claimLibraryAddress = await registryInstance.getOwnerIPClaims(claimOwner);
            let ownerListOfIPClaims = OwnerIPClaims.at(claimLibraryAddress);

            let lastClaim = await ownerListOfIPClaims.getClaimsCount();
            let claimAddress = await ownerListOfIPClaims.getClaim(lastClaim - 1);
            let claimInstance = IPClaim.at(claimAddress);

            let _claimOwner = await claimInstance.owner();
            let timestamp = await claimInstance.dateCreated();
            let _isPublic = await claimInstance.isPublic();

            let ipfsAddress = await claimInstance.privateIPFSAddress();
            let publicIPFSAddress = await claimInstance.publicIPFSAddress();
            let bytesToIpfsHash = util.getIpfsHashFromBytes32(ipfsAddress);

            let ipClaimsRegistryInstance = await claimInstance.registry();

            assert.strictEqual(lastClaim.toNumber(), 1, "claim count is not correct");
            assert.strictEqual(_claimOwner, claimOwner, "the owner is not the right one");
            assert.strictEqual(_isPublic, isPublic, "the owner is not the right one");
            assert.strictEqual(timestamp.toNumber(), timeNow, "timestamp is not set correctly");
            assert.strictEqual(bytesToIpfsHash, privateRandomIPFS, "the ipfsAddress is not set correctly");
            assert.strictEqual(ipClaimsRegistryInstance, registryInstance.address, "the registry address is not correct");
            assert.equal(emptyIPFSAddress, publicIPFSAddress, "empty IPFS address is not correct");
        });

        it("Should create PRIVATE claim with oracle last rate", async () => {
            let isPublic = false;
            payment = await tokenExchangeOracle.convertUSDToTokens(priceForCreatingPrivateClaim);
            await tokenInstance.approve(factoryInstance.address, payment, {from: claimOwner });

            let newRate = 150000;
            await tokenExchangeOracle.setRate(newRate, {from: oracleAdmin});

            await factoryInstance.createPrivateClaim(privateIPFS, claimType, {from: claimOwner});
            let timeNow = web3.eth.getBlock(web3.eth.blockNumber).timestamp;

            let claimLibraryAddress = await registryInstance.getOwnerIPClaims(claimOwner);
            let ownerListOfIPClaims = OwnerIPClaims.at(claimLibraryAddress);

            let lastClaim = await ownerListOfIPClaims.getClaimsCount();
            let claimAddress = await ownerListOfIPClaims.getClaim(lastClaim - 1);
            let claimInstance = IPClaim.at(claimAddress);

            let _claimOwner = await claimInstance.owner();
            let timestamp = await claimInstance.dateCreated();
            let ipfsAddress = await claimInstance.privateIPFSAddress();
            let publicIPFSAddress = await claimInstance.publicIPFSAddress();
            let _isPublic = await claimInstance.isPublic();
            let bytesToIpfsHash = util.getIpfsHashFromBytes32(ipfsAddress);
            let ipClaimsRegistryInstance = await claimInstance.registry();

            assert.strictEqual(lastClaim.toNumber(), 1, "claim count is not correct");
            assert.strictEqual(_claimOwner, claimOwner, "the owner is not the right one");
            assert.strictEqual(_isPublic, isPublic, "the owner is not the right one");
            assert.strictEqual(timestamp.toNumber(), timeNow, "timestamp is not set correctly");
            assert.strictEqual(bytesToIpfsHash, privateRandomIPFS, "the ipfsAddress is not set correctly");
            assert.strictEqual(emptyIPFSAddress, publicIPFSAddress, "the public ipfsAddress is not set correctly");
            assert.strictEqual(ipClaimsRegistryInstance, registryInstance.address, "the registry address is not correct");
        });

        it("Should charge the claimer with token tax for creating a PRIVATE claim", async () => {
            payment = await tokenExchangeOracle.convertUSDToTokens(priceForCreatingPrivateClaim);
            await tokenInstance.approve(factoryInstance.address, payment, {from: claimOwner });

            let initialTokenBalance = await tokenInstance.balanceOf(claimOwner);
            await factoryInstance.createPrivateClaim(privateIPFS, claimType, {from: claimOwner });

            let tokenBalanceAfterCreationOfClaim = await tokenInstance.balanceOf(claimOwner);

            assert.equal(tokenBalanceAfterCreationOfClaim.toString(), initialTokenBalance.sub(payment).toString());
        });

        it("Should NOT create PRIVATE claim if claimer has no tokens", async () => {
            let accountWithNoTokens = accounts[3];
            await util.expectThrow(factoryInstance.createPrivateClaim(privateIPFS, claimType, {from: accountWithNoTokens}));
        });

        it("Should create PUBLIC claim", async () => {
            let isPublic = true;
            payment = await tokenExchangeOracle.convertUSDToTokens(typePricesForCreate[claimType]);
            await tokenInstance.approve(factoryInstance.address, payment, {from: claimOwner });

            await factoryInstance.createPublicClaim(publicIPFS, claimType, {from: claimOwner});
            let timeNow = web3.eth.getBlock(web3.eth.blockNumber).timestamp;

            let claimLibraryAddress = await registryInstance.getOwnerIPClaims(claimOwner);
            let ownerListOfIPClaims = OwnerIPClaims.at(claimLibraryAddress);

            let lastClaim = await ownerListOfIPClaims.getClaimsCount();
            let claimAddress = await ownerListOfIPClaims.getClaim(lastClaim - 1);
            let claimInstance = IPClaim.at(claimAddress);

            let _claimOwner = await claimInstance.owner();
            let timestamp = await claimInstance.dateCreated();
            let ipfsAddress = await claimInstance.publicIPFSAddress();
            let privateIPFSAddress = await claimInstance.privateIPFSAddress();
            let _isPublic = await claimInstance.isPublic();
            let bytesToIpfsHash = util.getIpfsHashFromBytes32(ipfsAddress);
            let ipClaimsRegistryInstance = await claimInstance.registry();

            assert.strictEqual(lastClaim.toNumber(), 1, "claim count is not correct");
            assert.strictEqual(_claimOwner, claimOwner, "the owner is not the right one");
            assert.strictEqual(_isPublic, isPublic, "the owner is not the right one");
            assert.strictEqual(timestamp.toNumber(), timeNow, "timestamp is not set correctly");
            assert.strictEqual(bytesToIpfsHash, publicRandomIPFS, "the ipfsAddress is not set correctly");
            assert.strictEqual(privateIPFSAddress, emptyIPFSAddress, "the private ipfsAddress is not set correctly");
            assert.strictEqual(ipClaimsRegistryInstance, registryInstance.address, "the registry address is not correct");
        });

        it("Should create PUBLIC claim with oracle last rate", async () => {
            let isPublic = true;
            payment = await tokenExchangeOracle.convertUSDToTokens(typePricesForCreate[claimType]);
            await tokenInstance.approve(factoryInstance.address, payment, {from: claimOwner });

            let newRate = 150000;
            await tokenExchangeOracle.setRate(newRate, {from: oracleAdmin});

            await factoryInstance.createPublicClaim(publicIPFS, claimType, {from: claimOwner});
            let timeNow = web3.eth.getBlock(web3.eth.blockNumber).timestamp;

            let claimLibraryAddress = await registryInstance.getOwnerIPClaims(claimOwner);
            let ownerListOfIPClaims = OwnerIPClaims.at(claimLibraryAddress);

            let lastClaim = await ownerListOfIPClaims.getClaimsCount();
            let claimAddress = await ownerListOfIPClaims.getClaim(lastClaim - 1);
            let claimInstance = IPClaim.at(claimAddress);

            let _claimOwner = await claimInstance.owner();
            let timestamp = await claimInstance.dateCreated();
            let ipfsAddress = await claimInstance.publicIPFSAddress();
            let privateIPFSAddress = await claimInstance.privateIPFSAddress();
            let _isPublic = await claimInstance.isPublic();
            let bytesToIpfsHash = util.getIpfsHashFromBytes32(ipfsAddress);
            let ipClaimsRegistryInstance = await claimInstance.registry();

            assert.strictEqual(lastClaim.toNumber(), 1, "claim count is not correct");
            assert.strictEqual(_claimOwner, claimOwner, "the owner is not the right one");
            assert.strictEqual(_isPublic, isPublic, "the owner is not the right one");
            assert.strictEqual(timestamp.toNumber(), timeNow, "timestamp is not set correctly");
            assert.strictEqual(bytesToIpfsHash, publicRandomIPFS, "the ipfsAddress is not set correctly");
            assert.strictEqual(privateIPFSAddress, emptyIPFSAddress, "the private ipfsAddress is not set correctly");
            assert.strictEqual(ipClaimsRegistryInstance, registryInstance.address, "the registry address is not correct");
        });

        it("Should charge the claimer with token tax for creating a PUBLIC claim", async () => {
            payment = await tokenExchangeOracle.convertUSDToTokens(typePricesForCreate[claimType]);
            await tokenInstance.approve(factoryInstance.address, payment, {from: claimOwner });

            let initialTokenBalance = await tokenInstance.balanceOf(claimOwner);
            await factoryInstance.createPublicClaim(publicIPFS, claimType, {from: claimOwner });

            let tokenBalanceAfterCreationOfClaim = await tokenInstance.balanceOf(claimOwner);

            assert.equal(tokenBalanceAfterCreationOfClaim.toString(), initialTokenBalance.sub(payment).toString());
        });

        it("Should NOT create PUBLIC claim if claimer has no tokens", async () => {
            let accountWithNoTokens = accounts[3];
            await util.expectThrow(factoryInstance.createPublicClaim(publicIPFS, claimType, {from: accountWithNoTokens}));
        });

        it("Should emit creation of TestIPClaim", async () => {
            let expectedEvent = "IPClaimCreated";

            payment = await tokenExchangeOracle.convertUSDToTokens(priceForCreatingPrivateClaim);
            await tokenInstance.approve(factoryInstance.address, payment, {from: claimOwner });

            let transactionResult = await factoryInstance.createPrivateClaim(privateIPFS, claimType, {from: claimOwner});
            assert.strictEqual(transactionResult.logs[0].event, expectedEvent, "The event emitted was ${result.logs[0].event}")
        });

        it("Should NOT create a claim with empty IPFS hash", async () => {
            payment = await tokenExchangeOracle.convertUSDToTokens(priceForCreatingPrivateClaim);
            await tokenInstance.approve(factoryInstance.address, payment, {from: claimOwner });

            await util.expectThrow(factoryInstance.createPublicClaim("", claimType, {from: claimOwner}));
        });

        it("Should NOT create a claim with not existing type", async () => {
            let newClaimType = 12;
            payment = await tokenExchangeOracle.convertUSDToTokens(priceForCreatingPrivateClaim);
            await tokenInstance.approve(factoryInstance.address, payment, {from: claimOwner });

            await util.expectThrow(factoryInstance.createPublicClaim(privateIPFS, newClaimType, {from: claimOwner}));
        });

    });

    describe('Testing claim publishing', () => {

        beforeEach(async () => {
            payment = await tokenExchangeOracle.convertUSDToTokens(typePricesForCreate[claimType]);

            await tokenInstance.approve(factoryInstance.address, payment, {from: claimOwner });
            await factoryInstance.createPrivateClaim(privateIPFS, claimType, {from: claimOwner});

            let claimLibraryAddress = await registryInstance.getOwnerIPClaims(claimOwner);
            let ownerListOfIPClaimsInstance = OwnerIPClaims.at(claimLibraryAddress);
            let lastClaim = await ownerListOfIPClaimsInstance.getClaimsCount();
            claim = await ownerListOfIPClaimsInstance.getClaim(lastClaim - 1);
        });

        it("should publish a private claim", async () => {
            let taxInTokens = await tokenExchangeOracle.convertUSDToTokens(typePricesForPublish[claimType]);
            await tokenInstance.approve(factoryInstance.address, taxInTokens, {from: claimOwner});
            await factoryInstance.publishClaim(claim, privateIPFS, {from: claimOwner});

            let claimInstance = IPClaim.at(claim);
            let privateIPFSAddress = await claimInstance.privateIPFSAddress();
            let publicIPFSAddress = await claimInstance.publicIPFSAddress();

            assert.strictEqual(publicIPFSAddress, privateIPFSAddress);
        });

        it("should publish a private claim with last rate", async () => {
            let taxInTokens = await tokenExchangeOracle.convertUSDToTokens(typePricesForPublish[claimType]);

            let newRate = 1000;
            await tokenExchangeOracle.setRate(newRate, {from: oracleAdmin});

            await tokenInstance.approve(factoryInstance.address, taxInTokens, {from: claimOwner});
            await factoryInstance.publishClaim(claim, privateIPFS, {from: claimOwner});
        });

        it("should not publish if not from claim owner", async () => {
            let taxInTokens = await tokenExchangeOracle.convertUSDToTokens(typePricesForPublish[claimType]);
            await tokenInstance.approve(factoryInstance.address, taxInTokens, {from: claimOwner});

            await factoryInstance.publishClaim(claim, privateIPFS, {from: claimOwner});
        });

        it("should not publish if allowance is less then needed", async () => {
            let taxInTokens = await tokenExchangeOracle.convertUSDToTokens(typePricesForPublish[claimType]);
            await tokenInstance.approve(factoryInstance.address, taxInTokens.sub(1), {from: claimOwner});

            await util.expectThrow(factoryInstance.publishClaim(claim, privateIPFS, {from: claimOwner}));
        });

        it("should not publish if claim is public", async () => {
            let taxInTokens = await tokenExchangeOracle.convertUSDToTokens(typePricesForPublish[claimType]);
            await tokenInstance.approve(factoryInstance.address, taxInTokens, {from: claimOwner});

            await factoryInstance.publishClaim(claim, privateIPFS, {from: claimOwner});

            await util.expectThrow(factoryInstance.publishClaim(claim, privateIPFS, {from: claimOwner}));
        });
    });

    describe("Testing factory upgradability", () => {

        beforeEach(async () => {
            payment = await tokenExchangeOracle.convertUSDToTokens(typePricesForCreate[claimType]);
            await tokenInstance.approve(factoryInstance.address, payment, {from: claimOwner });
        });

        it("Should keep data stored after upgrade", async () => {

            let ownerBeforeUpgrade = await factoryInstance.getOwner();
            let factoryImplBefore = await factoryInstance.getImplementation();

            await factoryInstance.createPublicClaim(privateIPFS, claimType, {from: claimOwner});

            let ipClaimsFactoryNew = await IPClaimsFactoryTest.new({from: owner});

            await factoryInstance.upgradeImplementation(ipClaimsFactoryNew.address, {from: owner});

            factoryInstance = await IIPClaimsFactoryTest.at(factoryInstance.address);

            let ownerAfterUpgrade = await factoryInstance.getOwner();
            let factoryImplAfter = await factoryInstance.getImplementation();
            let registryAddress = await factoryInstance.getRegistry();

            assert.strictEqual(ownerBeforeUpgrade, ownerAfterUpgrade, "claim owner is not upgraded correctly");
            assert.strictEqual(registryAddress, registryInstance.address, "registry address is not correctly");
            assert.notEqual(factoryImplBefore, factoryImplAfter, "factory implementation addresses should not match");
        });

        it("Should add new functionality", async () => {
            let _testParams = 54;

            let ipClaimsFactoryNew = await IPClaimsFactoryTest.new({from: owner});

            await factoryInstance.upgradeImplementation(ipClaimsFactoryNew.address, {from: owner});

            factoryInstance = await IIPClaimsFactoryTest.at(factoryInstance.address);

            await factoryInstance.setTestParameter(_testParams, {from: owner});

            let testParameter = await factoryInstance.getTestParameter();

            assert.strictEqual(_testParams, testParameter.toNumber(), "test parameter is not set correctly");
        });

        it("Should NOT upgrade if not from owner", async () => {
            let ipClaimsFactoryNew = await IPClaimsFactoryTest.new();
            await util.expectThrow(factoryInstance.upgradeImplementation(ipClaimsFactoryNew.address, {from: notOwner}));
        });
    })
});