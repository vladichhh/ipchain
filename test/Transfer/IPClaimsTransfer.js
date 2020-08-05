const ProjectInitializator = require("../ProjectInitializator");
const MintableToken = artifacts.require("../TestContracts/Token/MintableToken.sol");
const OwnerIPClaims = artifacts.require("./OwnerIPClaims.sol");
const ethers = require('ethers');
const util = require("../util");
const TokenExchangeOracle = artifacts.require("./TokenExchangeOracle.sol");
const ETHExchangeOracle = artifacts.require("./ETHExchangeOracle.sol");


contract("IPClaimsTransfer", (accounts) => {

    const owner = accounts[0];
    const claimOwner = accounts[1];
    const claimBuyer = accounts[2];
    const oracleAdmin = accounts[3];
    const taxAccount = accounts[4];
    const feeReceiver = accounts[8];
    const notOwner = accounts[9];

    const randomIPFS = "QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ";
    let ipfsToBS58 = util.getBytes32FromIpfsHash(randomIPFS);

    let factoryInstance;
    let registryInstance;
    let vaultitudeUpgradableImplsInstance;
    let tokenInstance;
    let tokenExchangeOracle;
    let ethExchangeOracle;
    let ipClaimTransferInstance;

    let claimAddress;
    let lastClaim;
    let ownerListOfIPClaimsInstance;
    let claimLibraryAddress;

    const sellerPrivateKey = "2030b463177db2da82908ef90fa55ddfcef56e8183caf60db464bc398e736e6f";
    const buyerPrivateKey = "62ecd49c4ccb41a70ad46532aed63cf815de15864bc415c87d507afd6a5e8da2";

    const exchangeRate = "20000";
    const transferFeeInUSD = "1999"; // multiply by 100
    const freeTransferFeeInUSD = "2999"; // multiply by 100
    const claimPriceInWei = "3000000000000000000";
    const amountToMint = "20000000000000000000";
    const fakeAmount = "5900";
    const commissionPercent = "1000";
    let priceForCreatingPrivateClaim = "1000";
    const typePrices = ["2000", "3000", "4000", "5000"];
    const typePricesForPublish = ["2000", "3000", "4000", "5000"];
    const claimType = "1";
    let payment;

    beforeEach(async () => {
        tokenInstance = await MintableToken.new({from: owner});

        factoryInstance = await ProjectInitializator.initIPClaimsFactory();
        registryInstance = await ProjectInitializator.initIPClaimsRegistry();
        tokenInstance = await MintableToken.new();
        tokenExchangeOracle = await TokenExchangeOracle.new(oracleAdmin, exchangeRate);
        ethExchangeOracle = await ETHExchangeOracle.new(oracleAdmin, exchangeRate);
        ipClaimTransferInstance = await ProjectInitializator.initIPClaimsTransfer(owner);

        await factoryInstance.initWithParameters(registryInstance.address, tokenInstance.address, feeReceiver, tokenExchangeOracle.address, priceForCreatingPrivateClaim, typePrices, typePricesForPublish, {from: owner});
        await registryInstance.initWithParameters(factoryInstance.address, ipClaimTransferInstance.address, {from: owner});
        await ipClaimTransferInstance.initWithParameters(registryInstance.address,
            tokenInstance.address,
            taxAccount,
            commissionPercent,
            transferFeeInUSD,
            freeTransferFeeInUSD,
            ethExchangeOracle.address,
            tokenExchangeOracle.address, {
            from: owner
        });

        vaultitudeUpgradableImplsInstance = await ProjectInitializator.initVaultitudeUpgradableImpls(owner);
        await registryInstance.setVaultitudeUpgradableImpls(vaultitudeUpgradableImplsInstance.address, {from: owner});
        let ownerListOfIPClaims = await ProjectInitializator.initOwnerIPClaims();
        await vaultitudeUpgradableImplsInstance.setOwnerIPClaimsAddress(ownerListOfIPClaims, {from: owner});

        let createClaimTax = await tokenExchangeOracle.convertUSDToTokens(typePrices[claimType]);
        await tokenInstance.mint(claimOwner, amountToMint);
        await tokenInstance.approve(factoryInstance.address, createClaimTax, {from: claimOwner });
        await factoryInstance.createPublicClaim(ipfsToBS58, claimType, {from: claimOwner});

        claimLibraryAddress = await registryInstance.getOwnerIPClaims(claimOwner);
        ownerListOfIPClaimsInstance = OwnerIPClaims.at(claimLibraryAddress);

        lastClaim = await ownerListOfIPClaimsInstance.getClaimsCount();
        claimAddress = await ownerListOfIPClaimsInstance.getClaim(lastClaim - 1);

    });

    describe("Testing contract configurations", () => {

        it("should init contract with proper values", async () => {
            let registryAddress = await ipClaimTransferInstance.getRegistry();
            let currentOwner = await ipClaimTransferInstance.getOwner();
            let ethExchangeOracleAddress = await ipClaimTransferInstance.getETHExchangeOracle();

            assert.strictEqual(registryAddress, registryInstance.address, "the registry was not set correctly");
            assert.strictEqual(owner, currentOwner, "the owner address was not set correctly");
            assert.strictEqual(ethExchangeOracleAddress, ethExchangeOracle.address, "token exchangeOraacle address was not set correctly");
        });

        it("should change registry address from owner", async () => {
            await ipClaimTransferInstance.setRegistry(notOwner, {from: owner});
        });

        it("should NOT change registry address if not from owner", async () => {
            await util.expectThrow(ipClaimTransferInstance.setRegistry(notOwner, {from: notOwner}));
        });

        it("should change token address from owner", async () => {
            await ipClaimTransferInstance.setIPToken(notOwner, {from: owner});
        });

        it("should NOT change token address if not from owner", async () => {
            await util.expectThrow(ipClaimTransferInstance.setIPToken(notOwner, {from: notOwner}));
        });

        it("should change token tax address from owner", async () => {
            await ipClaimTransferInstance.setFeeReceiver(notOwner, {from: owner});
        });

        it("should NOT change tax address if not from owner", async () => {
            await util.expectThrow(ipClaimTransferInstance.setFeeReceiver(notOwner, {from: notOwner}));
        });

        it("should set commission correctly", async () => {
            let newCommission = "4000";
            await ipClaimTransferInstance.setCommissionPercentage(newCommission, {from: owner});
            let commission = await ipClaimTransferInstance.getCommissionPercentage();
            assert.strictEqual(commission.toString(), newCommission, "the commission was not set correctly");
        });

        it("should NOT set commission if not from owner", async () => {
            let newCommission = "2000";
            await util.expectThrow(ipClaimTransferInstance.setCommissionPercentage(newCommission, {from: notOwner}));
        });

        it("should set transferFeeInUSD correctly", async () => {
            let newTaxFee = "2000";
            await ipClaimTransferInstance.setFeeInUSD(newTaxFee, {from: owner});
            let getTaxFee = await ipClaimTransferInstance.getFeeInUSD();
            assert.strictEqual(getTaxFee.toString(), newTaxFee, "the tax fee was not set correctly");
        });

        it("should NOT set transferFeeInUSD if not from owner", async () => {
            let newTaxFee = "20";
            await util.expectThrow(ipClaimTransferInstance.setFeeInUSD(newTaxFee, {from: notOwner}));
        });

        it("should set freeTransferFeeInUSD correctly", async () => {
            let newTaxFee = "20";
            await ipClaimTransferInstance.setFreeTransferFeeInUSD(newTaxFee, {from: owner});
            let getTaxFee = await ipClaimTransferInstance.getFreeTransferFeeInUSD();
            assert.strictEqual(getTaxFee.toString(), newTaxFee, "the tax fee was not set correctly");
        });

        it("should NOT set freeTransferFeeInUSD if not from owner", async () => {
            let newTaxFee = "20";
            await util.expectThrow(ipClaimTransferInstance.setFreeTransferFeeInUSD(newTaxFee, {from: notOwner}));
        });

        it("should change eth oracle exchange", async () => {
            await ipClaimTransferInstance.setETHExchangeOracle(notOwner, {from: owner});
            let newOracle = await ipClaimTransferInstance.getETHExchangeOracle();
            assert.strictEqual(newOracle, notOwner, "the oracle was not changed correctly");
        });

        it("should NOT change eth oracle if not from owner", async () => {
            await util.expectThrow(ipClaimTransferInstance.setETHExchangeOracle(notOwner, {from: notOwner}));
        });
    });

    describe("Testing claim transfer with Ethers", () => {

        beforeEach(async () => {
            payment = await ethExchangeOracle.convertUSDToWei(transferFeeInUSD);
            payment = payment.add(claimPriceInWei);
        });

        it("should transfer claim from owner to buyer with Ethers", async () => {
            const wallet = new ethers.Wallet('0x' + sellerPrivateKey);
            const hashMsg = ethers.utils.solidityKeccak256(['bytes', 'bytes', 'bytes', 'int'], [claimOwner, claimBuyer, claimAddress, claimPriceInWei]);
            let hashData = ethers.utils.arrayify(hashMsg);
            const signature = wallet.signMessage(hashData);

            await ipClaimTransferInstance.transferIPClaimWithEthers(claimOwner, claimAddress, claimPriceInWei, signature, {
                from: claimBuyer,
                value: payment
            });

            let isSold = await ownerListOfIPClaimsInstance.getIsClaimSold(lastClaim - 1);

            let buyerClaimLibraryAddress = await registryInstance.getOwnerIPClaims(claimBuyer);
            let buyerOwnerListOfIPClaims = OwnerIPClaims.at(buyerClaimLibraryAddress);

            let buyerLastClaim = await buyerOwnerListOfIPClaims.getClaimsCount();
            let buyerClaimAddress = await buyerOwnerListOfIPClaims.getClaim(buyerLastClaim - 1);

            assert.ok(isSold);
            assert.strictEqual(buyerClaimAddress, claimAddress, "the owner was not changed correctly");
        });

        it("should NOT transfer claim if not signed from claim owner wallet", async () => {
            let claimLibraryAddress = await registryInstance.getOwnerIPClaims(claimOwner);
            let ownerListOfIPClaimsInstance = OwnerIPClaims.at(claimLibraryAddress);

            let lastClaim = await ownerListOfIPClaimsInstance.getClaimsCount();
            let claimAddress = await ownerListOfIPClaimsInstance.getClaim(lastClaim);

            let wallet = new ethers.Wallet('0x' + buyerPrivateKey);
            let hashMsg = ethers.utils.solidityKeccak256(['bytes', 'bytes', 'bytes', 'int'], [claimOwner, claimBuyer, claimAddress, claimPriceInWei]);
            let hashData = ethers.utils.arrayify(hashMsg);
            let signature = wallet.signMessage(hashData);
            await util.expectThrow(ipClaimTransferInstance.transferIPClaimWithEthers(claimOwner, claimAddress, claimPriceInWei, signature, {
                from: claimBuyer,
                value: payment
            }));
        });

        it("should NOT transfer claim if msg.value < ", async () => {
            let wallet = new ethers.Wallet('0x' + buyerPrivateKey);
            let hashMsg = ethers.utils.solidityKeccak256(['bytes', 'bytes', 'bytes', 'int'], [claimOwner, claimBuyer, claimAddress, claimPriceInWei]);
            let hashData = ethers.utils.arrayify(hashMsg);
            let signature = wallet.signMessage(hashData);
            await util.expectThrow(ipClaimTransferInstance.transferIPClaimWithEthers(claimOwner, claimAddress, claimPriceInWei, signature, {
                from: claimBuyer,
                value: fakeAmount
            }));
        });

        it("should NOT transfer already sold claim", async () => {
            const wallet = new ethers.Wallet('0x' + sellerPrivateKey);
            const hashMsg = ethers.utils.solidityKeccak256(['bytes', 'bytes', 'bytes', 'int'], [claimOwner, claimBuyer, claimAddress, claimPriceInWei]);
            let hashData = ethers.utils.arrayify(hashMsg);
            const signature = wallet.signMessage(hashData);

            await ipClaimTransferInstance.transferIPClaimWithEthers(claimOwner, claimAddress,claimPriceInWei,  signature, {
                from: claimBuyer,
                value: payment
            });

            await util.expectThrow(ipClaimTransferInstance.transferIPClaimWithEthers(claimOwner, claimAddress, claimPriceInWei, signature, {
                from: claimBuyer,
                value: payment
            }));
        });
    });

    describe("Testing free transfer (as a gift)", () => {

        beforeEach(async () => {
            payment = await tokenExchangeOracle.convertUSDToTokens(freeTransferFeeInUSD);
            await tokenInstance.approve(ipClaimTransferInstance.address, payment, {from: claimOwner });
        });

        it("should transfer claim from owner to buyer as a gift", async () => {
            const wallet = new ethers.Wallet('0x' + buyerPrivateKey);
            const hashMsg = ethers.utils.solidityKeccak256(['bytes'], [claimAddress]);
            let hashData = ethers.utils.arrayify(hashMsg);
            const signature = wallet.signMessage(hashData);
            await ipClaimTransferInstance.transferIPClaimAsAGift(claimBuyer, claimAddress, signature, {
                from: claimOwner
            });

            let isSold = await ownerListOfIPClaimsInstance.getIsClaimSold(lastClaim - 1);

            let buyerClaimLibraryAddress = await registryInstance.getOwnerIPClaims(claimBuyer);
            let buyerOwnerListOfIPClaims = OwnerIPClaims.at(buyerClaimLibraryAddress);

            let buyerLastClaim = await buyerOwnerListOfIPClaims.getClaimsCount();
            let buyerClaimAddress = await buyerOwnerListOfIPClaims.getClaim(buyerLastClaim - 1);

            assert.ok(isSold);
            assert.strictEqual(buyerClaimAddress, claimAddress, "the owner was not changed correctly");
        });

        it("should NOT transfer claim if not signed from claim buyer wallet", async () => {
            const wallet = new ethers.Wallet('0x' + sellerPrivateKey);
            const hashMsg = ethers.utils.solidityKeccak256(['bytes'], [claimAddress]);
            let hashData = ethers.utils.arrayify(hashMsg);
            const signature = wallet.signMessage(hashData);
            await util.expectThrow(ipClaimTransferInstance.transferIPClaimAsAGift(claimBuyer, claimAddress, signature, {
                from: claimOwner
            }));
        });

        it("should NOT transfer claim if not called from claim owner", async () => {
            const wallet = new ethers.Wallet('0x' + buyerPrivateKey);
            const hashMsg = ethers.utils.solidityKeccak256(['bytes'], [claimAddress]);
            let hashData = ethers.utils.arrayify(hashMsg);
            const signature = wallet.signMessage(hashData);
            await util.expectThrow(ipClaimTransferInstance.transferIPClaimAsAGift(claimBuyer, claimAddress, signature, {
                from: claimBuyer
            }));
        });

        it("should NOT transfer claim if the claim address is not the same", async () => {
            let fakeClaimAddress = accounts[7];
            const wallet = new ethers.Wallet('0x' + buyerPrivateKey);
            const hashMsg = ethers.utils.solidityKeccak256(['bytes'], [claimAddress]);
            let hashData = ethers.utils.arrayify(hashMsg);
            const signature = wallet.signMessage(hashData);
            await util.expectThrow(ipClaimTransferInstance.transferIPClaimAsAGift(claimBuyer, fakeClaimAddress, signature, {
                from: claimOwner
            }));
        });

        it("should NOT transfer claim if trying to transfer to someone else", async () => {
            const wallet = new ethers.Wallet('0x' + buyerPrivateKey);
            const hashMsg = ethers.utils.solidityKeccak256(['bytes'], [claimAddress]);
            let hashData = ethers.utils.arrayify(hashMsg);
            const signature = wallet.signMessage(hashData);
            await util.expectThrow(ipClaimTransferInstance.transferIPClaimAsAGift(notOwner, claimAddress, signature, {
                from: claimOwner
            }));
        });
    });
});