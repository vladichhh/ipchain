const ProjectInitializator = require("../ProjectInitializator");
const util = require("../util");
const MintableToken = artifacts.require("../TestContracts/Token/MintableToken.sol");
const TokenExchangeOracle = artifacts.require("./TokenExchangeOracle.sol");
const OwnerIPClaims = artifacts.require("./OwnerIPClaims.sol");
const IIPClaimsShareUpgrade = artifacts.require("../TestContracts/Share/IIPClaimsShareUpgrade.sol");
const IPClaimsShareUpgrade = artifacts.require("../TestContracts/Share/IPClaimsShareUpgrade.sol");


contract("IPClaimsShare", (accounts) => {

    const owner = accounts[0];
    const claimOwner = accounts[1];
    const claimReceiver = accounts[2];
    const feeReceiver = accounts[3];
    const notOwner = accounts[4];
    const admin = accounts[5];
    const factoryFeeReceiver = accounts[6];

    const claimType = 2;
    const priceForCreatingPrivateClaim = 1000;
    const claimTypePrices = [2000, 3000, 4000, 5000];
    const typePricesForPublish = [5000, 6000, 7000, 8000];
    const feeInUSD = 1000; // $ 10.00
    const amountToMint = 1000000000000000000; // ~ 1 ETH
    const initialRate = 200000; // 1 ETH = $ 200
    const randomIPFS = "QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ";
    const ipfsHash = util.getBytes32FromIpfsHash(randomIPFS);

    let factoryInstance;
    let shareInstance;
    let tokenInstance;
    let tokenExchangeOracle;
    let claim;

    beforeEach(async () => {
        factoryInstance = await ProjectInitializator.initIPClaimsFactory();
        let registryInstance = await ProjectInitializator.initIPClaimsRegistry();
        let transferInstance = await ProjectInitializator.initIPClaimsTransfer();
        shareInstance = await ProjectInitializator.initIPClaimsShare();
        let vaultitudeInstance = await ProjectInitializator.initVaultitudeUpgradableImpls();
        let ownerIPClaims = await ProjectInitializator.initOwnerIPClaims();

        tokenInstance = await MintableToken.new();
        tokenExchangeOracle = await TokenExchangeOracle.new(admin, initialRate);

        await factoryInstance.initWithParameters(registryInstance.address, tokenInstance.address, factoryFeeReceiver, tokenExchangeOracle.address,
            priceForCreatingPrivateClaim, claimTypePrices, typePricesForPublish);
        await registryInstance.initWithParameters(factoryInstance.address, transferInstance.address);
        await registryInstance.setVaultitudeUpgradableImpls(vaultitudeInstance.address);
        await vaultitudeInstance.setOwnerIPClaimsAddress(ownerIPClaims);

        let claimCreationPrice = await tokenExchangeOracle.convertUSDToTokens(claimTypePrices[claimType]);
        await tokenInstance.mint(claimOwner, claimCreationPrice);
        await tokenInstance.approve(factoryInstance.address, claimCreationPrice, {from: claimOwner});

        await factoryInstance.createPrivateClaim(ipfsHash, claimType, {from: claimOwner});

        let claimLibraryAddress = await registryInstance.getOwnerIPClaims(claimOwner);
        let ownerListOfIPClaimsInstance = OwnerIPClaims.at(claimLibraryAddress);

        let lastClaim = await ownerListOfIPClaimsInstance.getClaimsCount();
        claim = await ownerListOfIPClaimsInstance.getClaim(lastClaim - 1);
    });

    describe("initialization", () => {

        it("should initialize contract with correct values", async () => {
            await shareInstance.initWithParameters(feeInUSD, feeReceiver, tokenInstance.address, tokenExchangeOracle.address);

            let _owner = await shareInstance.getOwner();
            let _ipTokenAddress = await shareInstance.getIPToken();
            let _feeInUSD = await shareInstance.getFeeInUSD();
            let _feeReceiver = await shareInstance.getFeeReceiver();
            let _tokenExchangeOracle = await shareInstance.getTokenExchangeOracle();

            assert.strictEqual(owner, _owner, "The initial contract owner not set correctly");
            assert.strictEqual(feeInUSD, _feeInUSD.toNumber(), "The initial fee in USD not set correctly");
            assert.strictEqual(feeReceiver, _feeReceiver, "The initial fee receiver address not set correctly");
            assert.strictEqual(tokenInstance.address, _ipTokenAddress, "The initial IP token address not set correctly");
            assert.strictEqual(tokenExchangeOracle.address, _tokenExchangeOracle, "The initial token exchange oracle address not set correctly");
        });

        it("should not initialize contract twice", async () => {
            await shareInstance.initWithParameters(feeInUSD, feeReceiver, tokenInstance.address, tokenExchangeOracle.address);

            // second initialization attempt
            await util.expectThrow(shareInstance.initWithParameters(feeInUSD, feeReceiver, tokenInstance.address, tokenExchangeOracle.address));
        });

        it("should not initialize with empty fee receiver address", async () => {
            await util.expectThrow(shareInstance.initWithParameters(feeInUSD, "0x0", tokenInstance.address, tokenExchangeOracle.address));
        });

        it("should not initialize with empty IP token address", async () => {
            await util.expectThrow(shareInstance.initWithParameters(feeInUSD, feeReceiver, "0x0", tokenExchangeOracle.address));
        });

        it("should not initialize with empty Token exchange oracle address", async () => {
            await util.expectThrow(shareInstance.initWithParameters(feeInUSD, feeReceiver, tokenInstance.address, "0x0"));
        });

    });

    describe("setters", () => {

        beforeEach(async () =>  {
            await shareInstance.initWithParameters(feeInUSD, feeReceiver, tokenInstance.address, tokenExchangeOracle.address);
        });

        describe("feeInUSD", () => {

            let newFeeInUSD = 2000000000000000000;

            it("should update successfully", async () => {
                await shareInstance.setFeeInUSD(newFeeInUSD);
                let _newFeeInUSD = await shareInstance.getFeeInUSD();

                assert.strictEqual(newFeeInUSD, _newFeeInUSD.toNumber(), "fee in USD not updated correctly");
            });

            it("should not update if not owner", async () => {
                await util.expectThrow(shareInstance.setFeeInUSD(newFeeInUSD, {from: notOwner}));
            });

        });

        describe("feeReceiver", () => {

            it("should update successfully", async () => {
                await shareInstance.setFeeReceiver(notOwner);
                let _newFeeReceiver = await shareInstance.getFeeReceiver();

                assert.strictEqual(notOwner, _newFeeReceiver, "fee receiver not updated correctly");
            });

            it("should not update if not owner", async () => {
                await util.expectThrow(shareInstance.setFeeReceiver(notOwner, {from: notOwner}));
            });

            it("should not update if empty address", async () => {
                await util.expectThrow(shareInstance.setFeeReceiver("0x0"));
            });

        });

        describe("IPToken", () => {

            it("should update successfully", async () => {
                await shareInstance.setIPToken(notOwner);
                let _newIPToken = await shareInstance.getIPToken();

                assert.strictEqual(notOwner, _newIPToken, "IP token address not updated correctly");
            });

            it("should not update if not owner", async () => {
                await util.expectThrow(shareInstance.setIPToken(notOwner, {from: notOwner}));
            });

            it("should not update if empty address", async () => {
                await util.expectThrow(shareInstance.setIPToken("0x0"));
            });

        });

        describe("TokenExchangeOracle", () => {

            it("should update successfully", async () => {
                await shareInstance.setTokenExchangeOracle(notOwner);
                let _newTokenExchangeOracle = await shareInstance.getTokenExchangeOracle();

                assert.strictEqual(notOwner, _newTokenExchangeOracle, "Token exchange oracle address not updated correctly");
            });

            it("should not update if not owner", async () => {
                await util.expectThrow(shareInstance.setTokenExchangeOracle(notOwner, {from: notOwner}));
            });

            it("should not update if empty address", async () => {
                await util.expectThrow(shareInstance.setTokenExchangeOracle("0x0"));
            });

        });

    });

    describe("transfer contract ownership", () => {

        beforeEach(async () =>  {
            await shareInstance.initWithParameters(feeInUSD, feeReceiver, tokenInstance.address, tokenExchangeOracle.address);
        });

        it("should transfer ownership successfully", async () => {
            await shareInstance.transferOwnership(notOwner);

            let _newOwner = await shareInstance.getOwner();
            assert.strictEqual(notOwner, _newOwner, "New owner does not match after transferring ownership");
        });

        it("should transfer ownership successfully and check event", async () => {
            let result = await shareInstance.transferOwnership(notOwner);

            assert.strictEqual(result.logs.length, 1, "Event count does not match");
            assert.strictEqual("OwnershipTransferred", result.logs[0].event, "The event name does not match");
        });

        it("should not transfer ownership if not owner", async () => {
            await util.expectThrow(shareInstance.transferOwnership(notOwner, {from: notOwner}));
        });

        it("should not transfer ownership if empty newOwner address", async () => {
            await util.expectThrow(shareInstance.transferOwnership("0x0"));
        });

    });

    describe("share IP claim", () => {

        beforeEach(async () =>  {
            await shareInstance.initWithParameters(feeInUSD, feeReceiver, tokenInstance.address, tokenExchangeOracle.address);
            await tokenInstance.mint(claimOwner, amountToMint);
            await tokenInstance.approve(shareInstance.address, amountToMint, {from: claimOwner});
        });

        it("should share IP claim successfully", async () => {
            await shareInstance.shareIPClaim(claim, claimReceiver, ipfsHash, {from: claimOwner});

            let recipients = await shareInstance.getRecipientsCountPerClaim(claim);
            let [_claimReceiver, _ndaHash] = await shareInstance.getRecipientPerClaim(claim, 0);

            let claims = await shareInstance.getClaimsCountPerRecipient(claimReceiver);
            let _claim = await shareInstance.getClaimPerRecipient(claimReceiver, 0);

            assert.strictEqual(1, recipients.toNumber(), "Recipients count does not match");
            assert.strictEqual(claimReceiver, _claimReceiver, "Claim receiver does not match");
            assert.strictEqual(ipfsHash, _ndaHash, "Signed NDA hash does not match");

            assert.strictEqual(1, claims.toNumber(), "Claims count does not match");
            assert.strictEqual(claim, _claim, "Claim does not match");
        });

        it("should share IP claim successfully and check event", async () => {
            let result = await shareInstance.shareIPClaim(claim, claimReceiver, ipfsHash, {from: claimOwner});

            assert.strictEqual(result.logs.length, 1, "Event count does not match");
            assert.strictEqual("IPClaimShared", result.logs[0].event, "The event name does not match");
        });

        it("should share IP claim successfully and check account balances", async () => {
            let initOwnerBalance = await tokenInstance.balanceOf(claimOwner);
            let initReceiverBalance = await tokenInstance.balanceOf(feeReceiver);

            await shareInstance.shareIPClaim(claim, claimReceiver, ipfsHash, {from: claimOwner});
            let feeInTokens = await tokenExchangeOracle.convertUSDToTokens(feeInUSD);

            let finalOwnerBalance = await tokenInstance.balanceOf(claimOwner);
            let finalReceiverBalance = await tokenInstance.balanceOf(feeReceiver);

            let expectedOwnerBalance = initOwnerBalance.toNumber() - feeInTokens.toNumber();
            let expectedReceiverBalance = initReceiverBalance.toNumber() + feeInTokens.toNumber();

            assert.strictEqual(initReceiverBalance.toNumber(), 0, "Initial receiver balance is not zero");
            assert.strictEqual(expectedOwnerBalance, finalOwnerBalance.toNumber(), "Expected owner balance does not match");
            assert.strictEqual(expectedReceiverBalance, finalReceiverBalance.toNumber(), "Expected receiver balance does not match");
        });

        it("should not share if empty claim address", async () => {
            await util.expectThrow(shareInstance.shareIPClaim("0x0", claimReceiver, ipfsHash, {from: claimOwner}));
        });

        it("should not share if empty claim receiver address", async () => {
            await util.expectThrow(shareInstance.shareIPClaim(claim, "0x0", ipfsHash, {from: claimOwner}));
        });

        it("should not share if not claim owner", async () => {
            await util.expectThrow(shareInstance.shareIPClaim(claim, claimReceiver, ipfsHash, {from: notOwner}));
        });

        it("should not share if not private claim", async () => {
            let claimPublishFeeInTokens = await tokenExchangeOracle.convertUSDToTokens(typePricesForPublish[claimType]);

            await tokenInstance.approve(factoryInstance.address, claimPublishFeeInTokens, {from: claimOwner});

            await factoryInstance.publishClaim(claim, ipfsHash, {from: claimOwner});
            await util.expectThrow(shareInstance.shareIPClaim(claim, claimReceiver, ipfsHash, {from: claimOwner}));
        });

        it("should not share IP claim twice to the same recipient", async () => {
            await shareInstance.shareIPClaim(claim, claimReceiver, ipfsHash, {from: claimOwner});

            // second attempt to share IP claim to the same recipient
            await util.expectThrow(shareInstance.shareIPClaim(claim, claimReceiver, ipfsHash, {from: claimOwner}));
        });

        it("should not share IP claim if not enough tokens", async () => {
            await tokenInstance.decreaseApproval(shareInstance.address, amountToMint, {from: claimOwner});

            await util.expectThrow(shareInstance.shareIPClaim(claim, claimReceiver, ipfsHash, {from: claimOwner}));
        });

    });

    describe("upgradeability", () => {

        let shareContractUpgrade;

        beforeEach(async () =>  {
            await shareInstance.initWithParameters(feeInUSD, feeReceiver, tokenInstance.address, tokenExchangeOracle.address);
            await tokenInstance.mint(claimOwner, amountToMint);
            await tokenInstance.approve(shareInstance.address, amountToMint, {from: claimOwner});
            await shareInstance.shareIPClaim(claim, claimReceiver, ipfsHash, {from: claimOwner});

            shareContractUpgrade = await IPClaimsShareUpgrade.new();
        });

        it("should change implementation after upgrade", async () => {
            let _impl = await shareInstance.getImplementation();

            // upgrade implementation
            await shareInstance.upgradeImplementation(shareContractUpgrade.address);

            let __impl = await shareInstance.getImplementation();

            assert.notStrictEqual(_impl, __impl, "Implementation address should not match after upgrade");
        });

        it("should keep data after upgrade", async () => {
            let _owner = await shareInstance.getOwner();

            let _feeInUSD = await shareInstance.getFeeInUSD();
            let _feeReceiver = await shareInstance.getFeeReceiver();
            let _ipToken = await shareInstance.getIPToken();
            let _tokenExchangeOracle = await shareInstance.getTokenExchangeOracle();
            
            let _recipients = await shareInstance.getRecipientsCountPerClaim(claim);
            let [_claimReceiver, _ndaHash] = await shareInstance.getRecipientPerClaim(claim, 0);

            let _claims = await shareInstance.getClaimsCountPerRecipient(claimReceiver);
            let _claim = await shareInstance.getClaimPerRecipient(claimReceiver, 0);

            // upgrade implementation
            await shareInstance.upgradeImplementation(shareContractUpgrade.address);

            let __owner = await shareInstance.getOwner();

            let __feeInUSD = await shareInstance.getFeeInUSD();
            let __feeReceiver = await shareInstance.getFeeReceiver();
            let __ipToken = await shareInstance.getIPToken();
            let __tokenExchangeOracle = await shareInstance.getTokenExchangeOracle();
            
            let __recipients = await shareInstance.getRecipientsCountPerClaim(claim);
            let [__claimReceiver, __ndaHash] = await shareInstance.getRecipientPerClaim(claim, 0);

            let __claims = await shareInstance.getClaimsCountPerRecipient(claimReceiver);
            let __claim = await shareInstance.getClaimPerRecipient(claimReceiver, 0);

            assert.strictEqual(_owner, __owner, "Owner does not match after upgrade");

            assert.strictEqual(_feeInUSD.toNumber(), __feeInUSD.toNumber(), "Fee in USD does not match after upgrade");
            assert.strictEqual(_feeReceiver, __feeReceiver, "Fee receiver does not match after upgrade");
            assert.strictEqual(_ipToken, __ipToken, "IP token address does not match after upgrade");
            assert.strictEqual(_tokenExchangeOracle, __tokenExchangeOracle, "Token exchange oracle address does not match after upgrade");

            assert.strictEqual(_recipients.toNumber(), __recipients.toNumber(), "Claim recipients count does not match after upgrade");
            assert.strictEqual(_claimReceiver, __claimReceiver, "Claim receiver does not match after upgrade");
            assert.strictEqual(_ndaHash, __ndaHash, "Signed NDA hash does not match after upgrade");

            assert.strictEqual(_claims.toNumber(), __claims.toNumber(), "Claims count does not match after upgrade");
            assert.strictEqual(_claim, __claim, "Claim does not match after upgrade");
        });

        it("should call successfully the new functionality after upgrade", async () => {
            // upgrade implementation
            await shareInstance.upgradeImplementation(shareContractUpgrade.address);

            let shareInstanceUpgrade = await IIPClaimsShareUpgrade.at(shareInstance.address);

            await shareInstanceUpgrade.setTestParameter(notOwner);
            let testParameter = await shareInstanceUpgrade.getTestParameter();

            assert.strictEqual(notOwner, testParameter, "Expected test address does not match");
        });

        it("should not upgrade if not owner", async () => {
            await util.expectThrow(shareInstance.upgradeImplementation(shareContractUpgrade.address, {from: notOwner}));
        });

    });

});