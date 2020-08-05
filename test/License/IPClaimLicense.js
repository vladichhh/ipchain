const ProjectInitializator = require("../ProjectInitializator");
const util = require("../util");
const MintableToken = artifacts.require("../TestContracts/Token/MintableToken.sol");
const OwnerIPClaims = artifacts.require("./OwnerIPClaims.sol");
const ethers = require("ethers");
const IPClaimsLicenseTest = artifacts.require("./IPClaimsLicenseTest.sol");
const IIPClaimsLicenseTest = artifacts.require("./IIPClaimsLicenseTest.sol");
let ECTools = artifacts.require("./ECTools.sol");
const ETHExchangeOracle = artifacts.require("./ETHExchangeOracle.sol");
const TokenExchangeOracle = artifacts.require("./TokenExchangeOracle.sol");

contract("IPClaimsLicense", (accounts) => {

    const owner = accounts[0];
    const claimOwner = accounts[1];
    const claimReceiver = accounts[2];
    const oracleAdmin = accounts[3];
    const feeReceiver = accounts[6];
    const testAddress = accounts[7];
    const factoryFeeReceiver = accounts[8];
    const notOwner = accounts[9];

    const randomIPFS = "QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ";
    let ipfsToBS58 = util.getBytes32FromIpfsHash(randomIPFS);
    const feeInUSD = "3999"; // 39.99 USD
    const commissionPercent = "500";
    const testFee = "234535";
    const licensePrice = "2000000000000000000"; // 2 ETH
    const amountToMint = "20000000000000000000"; // 20 ETH
    const exchangeRate = "250000";
    const licenseMinPeriod = "89";
    const licenseMaxPeriod = "365";
    let priceForCreatingPrivateClaim = "1000";
    const typePrices = ["2000", "3000", "4000", "5000"];
    let typePricesForPublish = ["2000", "3000", "4000", "5000"];
    const claimType = "3";
    let payment;

    const sellerPrivateKey = "0x2030b463177db2da82908ef90fa55ddfcef56e8183caf60db464bc398e736e6f";
    const buyerPrivateKey = "0xfac0bc9325ad342033afe956e83f0bf8f1e863c1c3e956bc75d66961fe4cd186";

    let claimAddress;
    let lastClaim;
    let ownerListOfIPClaimsInstance;
    let claimLibraryAddress;

    let factoryInstance;
    let registryInstance;
    let vaultitudeUpgradableImplsInstance;
    let licenseInstance;
    let ethExchangeOracle;
    let tokenExchangeOracle;
    let transferInstance;
    let tokenInstance;

    beforeEach(async () => {
        factoryInstance = await ProjectInitializator.initIPClaimsFactory();
        registryInstance = await ProjectInitializator.initIPClaimsRegistry();
        licenseInstance = await ProjectInitializator.initIPClaimsLicense();
        tokenInstance = await MintableToken.new();
        ethExchangeOracle = await ETHExchangeOracle.new(oracleAdmin, exchangeRate);
        tokenExchangeOracle = await TokenExchangeOracle.new(oracleAdmin, exchangeRate);
        transferInstance = await ProjectInitializator.initIPClaimsTransfer(owner);

        await factoryInstance.initWithParameters(registryInstance.address, tokenInstance.address, factoryFeeReceiver, tokenExchangeOracle.address, priceForCreatingPrivateClaim, typePrices, typePricesForPublish, {from: owner});
        await registryInstance.initWithParameters(factoryInstance.address, transferInstance.address, {from: owner});

        vaultitudeUpgradableImplsInstance = await ProjectInitializator.initVaultitudeUpgradableImpls(owner);

        await registryInstance.setVaultitudeUpgradableImpls(vaultitudeUpgradableImplsInstance.address, {from: owner});

        let libraryInstance = await ProjectInitializator.initOwnerIPClaims();

        await vaultitudeUpgradableImplsInstance.setOwnerIPClaimsAddress(libraryInstance, {from: owner});

        await licenseInstance.initWithParameters(feeInUSD, commissionPercent, feeReceiver, tokenInstance.address, licenseMinPeriod, licenseMaxPeriod, ethExchangeOracle.address);

        let createClaimTax = await tokenExchangeOracle.convertUSDToTokens(typePrices[claimType]);
        await tokenInstance.mint(claimOwner, amountToMint);
        await tokenInstance.approve(factoryInstance.address, createClaimTax, {from: claimOwner });

        await factoryInstance.createPublicClaim(ipfsToBS58, claimType, {from: claimOwner});

        claimLibraryAddress = await registryInstance.getOwnerIPClaims(claimOwner);
        ownerListOfIPClaimsInstance = OwnerIPClaims.at(claimLibraryAddress);

        lastClaim = await ownerListOfIPClaimsInstance.getClaimsCount();
        claimAddress = await ownerListOfIPClaimsInstance.getClaim(lastClaim - 1);
    });

    describe("Testing licenseContract initialization", () => {

        it("Should init and set token address", async () => {
            let _owner = await licenseInstance.getOwner();
            let _tokenAddress = await licenseInstance.getIPTokenAddress();
            let _feeReceiver = await licenseInstance.getFeeReceiver();
            let _tokenExchangeOracle = await licenseInstance.getETHExchangeOracle();

            assert.strictEqual(_owner, owner, "the owner is not set correctly");
            assert.strictEqual(tokenInstance.address, _tokenAddress, "the ERC20 instance address is not set correctly");
            assert.strictEqual(_feeReceiver, feeReceiver, "the fee receiver is not set correctly");
            assert.strictEqual(_tokenExchangeOracle, ethExchangeOracle.address, "");
        });

        it("Should NOT init if inited", async () => {
            await util.expectThrow(licenseInstance.initWithParameters(feeInUSD, commissionPercent, feeReceiver, tokenInstance.address, licenseMinPeriod, licenseMaxPeriod, ethExchangeOracle.address));
        });

        it("Should set license fee in USD from Owner", async () => {
            await licenseInstance.setFeeInUSD(testFee, {from: owner});
            let newFeeInUSD = await licenseInstance.getFeeInUSD({from: owner});

            assert.equal(testFee, newFeeInUSD.toNumber(), "the fee in ethers was not changed correctly")
        });

        it("Should NOT set license fee if not from Owner", async () => {
            await util.expectThrow(licenseInstance.setFeeInUSD(+feeInUSD + +feeInUSD, {from: notOwner}));
        });

        it("Should set commission percentage from Owner", async () => {
            let newCommissionPercentage = 2000;
            await licenseInstance.setCommissionPercentage(newCommissionPercentage, {from: owner});
            let _newCommissionPercentage = await licenseInstance.getCommissionPercentage({from: owner});

            assert.equal(newCommissionPercentage, _newCommissionPercentage.toNumber(), "the fee in ethers was not changed correctly")
        });

        it("Should NOT set lcommission percentage if not from Owner", async () => {
            let newCommissionPercentage = 2000;
            await util.expectThrow(licenseInstance.setCommissionPercentage(newCommissionPercentage, {from: notOwner}));
        });

        it("Should set token address from Owner", async () => {
            await licenseInstance.setIPTokenAddress(testAddress, {from: owner});
            let newTokenInstance = await licenseInstance.getIPTokenAddress({from: owner});
            assert.strictEqual(newTokenInstance, testAddress, "the token instance address was not changed correctly")
        });

        it("Should NOT set token address if not from Owner", async () => {
            await util.expectThrow(licenseInstance.setIPTokenAddress(testAddress, {from: notOwner}));
        });

        it("Should NOT set empty token address", async () => {
            await util.expectThrow(licenseInstance.setIPTokenAddress("", {from: owner}));
        });

        it("Should set feeReceiver address from Owner", async () => {
            await licenseInstance.setFeeReceiver(testAddress, {from: owner});
            let newFeeReceiver = await licenseInstance.getFeeReceiver();
            assert.strictEqual(newFeeReceiver, testAddress, "the fee reseiver address was not changed correctly")
        });

        it("Should NOT set feeReceiver address if not from Owner", async () => {
            await util.expectThrow(licenseInstance.setFeeReceiver(testAddress, {from: notOwner}));
        });

        it("Should NOT set empty feeReceiver address", async () => {
            await util.expectThrow(licenseInstance.setFeeReceiver("", {from: owner}));
        });

        it("Should set eth oracle address from Owner", async () => {
            await licenseInstance.setETHExchangeOracle(testAddress, {from: owner});
            let newEthOracleAddress = await licenseInstance.getETHExchangeOracle();
            assert.strictEqual(newEthOracleAddress, testAddress, "")
        });

        it("Should NOT set ethExchange address if not from Owner", async () => {
            await util.expectThrow(licenseInstance.setETHExchangeOracle(testAddress, {from: notOwner}));
        });

        it("Should NOT set empty ethExchange address", async () => {
            await util.expectThrow(licenseInstance.setETHExchangeOracle("", {from: owner}));
        });
    });

    describe("Testing transfer licenseContract ownership", () => {

        it("Should not transfer ownership if empty newOwner address", async () => {
            await util.expectThrow(licenseInstance.transferOwnership("0x0", {from: owner}));
        });

        it("Should transfer ownership", async () => {
            await licenseInstance.transferOwnership(notOwner, {from: owner});
        });
    });

    describe("Testing claim licensing with Ethers", () => {

        beforeEach(async () => {
            payment = await ethExchangeOracle.convertUSDToWei(feeInUSD);
            payment = payment.add(licensePrice);
        });

        it("should register license with Ethers", async () => {
            const months = 9;
            let days = util.getNextNMontsInDays(months);

            let currentDate = new Date();
            let dateAfterNMonths = new Date(currentDate.getFullYear(), currentDate.getMonth() + months, currentDate.getDate() - 1);

            let nonce = await licenseInstance.getNonce(claimAddress);

            const wallet = new ethers.Wallet(sellerPrivateKey);
            const hashMsg = ethers.utils.solidityKeccak256(['bytes', 'bytes', 'bytes', 'int256', 'int256', 'int256'], [claimOwner, claimReceiver, claimAddress, licensePrice, days, nonce.toString()]);
            let hashData = ethers.utils.arrayify(hashMsg);
            const signature = wallet.signMessage(hashData);

            await licenseInstance.registerLicenseWithEthers(claimOwner, claimAddress, licensePrice, days, signature, {
                from: claimReceiver,
                value: payment
            });

            let licenseEndDate = await licenseInstance.getEndDateOfLicense(claimAddress, claimReceiver);

            licenseEndDate = new Date(licenseEndDate * 1000);

            assert.strictEqual(licenseEndDate.toDateString(), dateAfterNMonths.toDateString(), "");
        });

        it("should NOT register license if not signed from owners wallet", async () => {
            const months = 3;
            let days = util.getNextNMontsInDays(months);

            let nonce = await licenseInstance.getNonce(claimAddress);

            const wallet = new ethers.Wallet(buyerPrivateKey);
            const hashMsg = ethers.utils.solidityKeccak256(['bytes', 'bytes', 'bytes', 'int256', 'int256', 'int256'], [claimOwner, claimReceiver, claimAddress, licensePrice, days, nonce.toString()]);
            let hashData = ethers.utils.arrayify(hashMsg);
            const signature = wallet.signMessage(hashData);

            await util.expectThrow(licenseInstance.registerLicenseWithEthers(claimOwner, claimAddress, licensePrice, days, signature, {
                from: claimReceiver,
                value: payment
            }));
        });

        it("should NOT register license if msg value <", async () => {
            const months = 3;
            let days = util.getNextNMontsInDays(months);
            let fakePayment = "1299999999999999";

            let nonce = await licenseInstance.getNonce(claimAddress);

            const wallet = new ethers.Wallet(sellerPrivateKey);
            const hashMsg = ethers.utils.solidityKeccak256(['bytes', 'bytes', 'bytes', 'int256', 'int256', 'int256'], [claimOwner, claimReceiver, claimAddress, licensePrice, days, nonce.toString()]);
            let hashData = ethers.utils.arrayify(hashMsg);
            const signature = wallet.signMessage(hashData);

            await util.expectThrow(licenseInstance.registerLicenseWithEthers(claimOwner, claimAddress, licensePrice, days, signature, {
                from: claimReceiver,
                value: fakePayment
            }));
        });

        it("should extend license if already", async () => {
            const months = 12;
            const miliseconds = 1000;
            let days = util.getNextNMontsInDays(months);

            let nonce = await licenseInstance.getNonce(claimAddress);

            const wallet = new ethers.Wallet(sellerPrivateKey);
            const hashMsg = ethers.utils.solidityKeccak256(['bytes', 'bytes', 'bytes', 'int256', 'int256', 'int256'], [claimOwner, claimReceiver, claimAddress, licensePrice, days, nonce.toString()]);
            let hashData = ethers.utils.arrayify(hashMsg);
            const signature = wallet.signMessage(hashData);

            await licenseInstance.registerLicenseWithEthers(claimOwner, claimAddress, licensePrice, days, signature, {
                from: claimReceiver,
                value: payment
            });

            let endDate = await licenseInstance.getEndDateOfLicense(claimAddress, claimReceiver);
            let expectedEndDate = new Date();
            expectedEndDate.setMonth(expectedEndDate.getMonth() + months);
            expectedEndDate.setDate(expectedEndDate.getDate() - 1);
            assert.equal(endDate.toString(), Math.floor(expectedEndDate.getTime() / miliseconds));

            nonce = await licenseInstance.getNonce(claimAddress);
            const hashMsgNew = ethers.utils.solidityKeccak256(['bytes', 'bytes', 'bytes', 'int256', 'int256', 'int256'], [claimOwner, claimReceiver, claimAddress, licensePrice, days, nonce.toString()]);
            let hashDataNew = ethers.utils.arrayify(hashMsgNew);
            const signatureNew = wallet.signMessage(hashDataNew);

            let tokenHardFee = await ethExchangeOracle.convertUSDToWei(feeInUSD);
            await tokenInstance.approve(licenseInstance.address, tokenHardFee, {from: claimReceiver});

            await licenseInstance.registerLicenseWithEthers(claimOwner, claimAddress, licensePrice, days, signatureNew, {
                from: claimReceiver,
                value: payment
            });
            endDate = await licenseInstance.getEndDateOfLicense(claimAddress, claimReceiver);
            expectedEndDate.setMonth(expectedEndDate.getMonth() + months);
            expectedEndDate.setDate(expectedEndDate.getDate() - 2);
            let newEndDate = Math.floor(expectedEndDate.getTime() / miliseconds);
            assert.equal(endDate.toString(), newEndDate)
        });

        it("should NOT extend license if signed with old nonce", async () => {
            const months = 12;
            let days = util.getNextNMontsInDays(months);

            let nonce = await licenseInstance.getNonce(claimAddress);

            const wallet = new ethers.Wallet(sellerPrivateKey);
            const hashMsg = ethers.utils.solidityKeccak256(['bytes', 'bytes', 'bytes', 'int256', 'int256', 'int256'], [claimOwner, claimReceiver, claimAddress, licensePrice, days, nonce.toString()]);
            let hashData = ethers.utils.arrayify(hashMsg);
            const signature = wallet.signMessage(hashData);

            await licenseInstance.registerLicenseWithEthers(claimOwner, claimAddress, licensePrice, days, signature, {
                from: claimReceiver,
                value: payment
            });

            await util.expectThrow(licenseInstance.registerLicenseWithEthers(claimOwner, claimAddress, licensePrice, days, signature, {
                from: claimReceiver,
                value: payment
            }));
        });
    });

    describe("Testing getting info about licensees per claim", () => {
        beforeEach(async () => {
            payment = await ethExchangeOracle.convertUSDToWei(feeInUSD);
            payment = payment.add(licensePrice);
        });

        it('should return licenses count for a specific claim', async () => {
            const months = 6;
            let correctCount = 1;
            let days = util.getNextNMontsInDays(months);

            let nonce = await licenseInstance.getNonce(claimAddress);
            let wallet = new ethers.Wallet(sellerPrivateKey);
            let hashMsg = ethers.utils.solidityKeccak256(['bytes', 'bytes', 'bytes', 'int256', 'int256', 'int256'], [claimOwner, claimReceiver, claimAddress, licensePrice, days, nonce.toString()]);
            let hashData = ethers.utils.arrayify(hashMsg);
            let signature = wallet.signMessage(hashData);

            await licenseInstance.registerLicenseWithEthers(claimOwner, claimAddress, licensePrice, days, signature, {
                from: claimReceiver,
                value: payment
            });

            let licensesCount = await licenseInstance.getLicensesCountPerClaim(claimAddress);
            assert.equal(correctCount, licensesCount.toNumber());
        });

        it('should count only one address if claim has the same licensee twice', async () => {
            const months = 6;
            let days = util.getNextNMontsInDays(months);

            let nonce = await licenseInstance.getNonce(claimAddress);
            let wallet = new ethers.Wallet(sellerPrivateKey);
            let hashMsg = ethers.utils.solidityKeccak256(['bytes', 'bytes', 'bytes', 'int256', 'int256', 'int256'], [claimOwner, claimReceiver, claimAddress, licensePrice, days, nonce.toString()]);
            let hashData = ethers.utils.arrayify(hashMsg);
            let signature = wallet.signMessage(hashData);

            await licenseInstance.registerLicenseWithEthers(claimOwner, claimAddress, licensePrice, days, signature, {
                from: claimReceiver,
                value: payment
            });

            nonce = await licenseInstance.getNonce(claimAddress);
            hashMsg = ethers.utils.solidityKeccak256(['bytes', 'bytes', 'bytes', 'int256', 'int256', 'int256'], [claimOwner, claimReceiver, claimAddress, licensePrice, days, nonce.toString()]);
            hashData = ethers.utils.arrayify(hashMsg);
            signature = wallet.signMessage(hashData);

            await licenseInstance.registerLicenseWithEthers(claimOwner, claimAddress, licensePrice, days, signature, {
                from: claimReceiver,
                value: payment
            });

            let licensesCount = await licenseInstance.getLicensesCountPerClaim(claimAddress);

            let licenseeAddress = await licenseInstance.getLicensee(claimAddress, licensesCount - 1);
            assert.equal(licenseeAddress, claimReceiver)
        });
    });

    describe("Testing getting info about licenses per licensee", () => {
        beforeEach(async () => {
            payment = await ethExchangeOracle.convertUSDToWei(feeInUSD);
            payment = payment.add(licensePrice);
        });

        it('should return licenses count for a licensee', async () => {
            const months = 6;
            let correctCount = 1;
            let days = util.getNextNMontsInDays(months);

            let nonce = await licenseInstance.getNonce(claimAddress);
            let wallet = new ethers.Wallet(sellerPrivateKey);
            let hashMsg = ethers.utils.solidityKeccak256(['bytes', 'bytes', 'bytes', 'int256', 'int256', 'int256'], [claimOwner, claimReceiver, claimAddress, licensePrice, days, nonce.toString()]);
            let hashData = ethers.utils.arrayify(hashMsg);
            let signature = wallet.signMessage(hashData);

            await licenseInstance.registerLicenseWithEthers(claimOwner, claimAddress, licensePrice, days, signature, {
                from: claimReceiver,
                value: payment
            });

            let licenseesCount = await licenseInstance.getClaimCountPerLicensee(claimReceiver);
            assert.equal(correctCount, licenseesCount.toNumber());
        });

        it('should count only one address if licensee has the same license twice', async () => {
            const months = 6;
            let days = util.getNextNMontsInDays(months);

            let nonce = await licenseInstance.getNonce(claimAddress);
            let wallet = new ethers.Wallet(sellerPrivateKey);
            let hashMsg = ethers.utils.solidityKeccak256(['bytes', 'bytes', 'bytes', 'int256', 'int256', 'int256'], [claimOwner, claimReceiver, claimAddress, licensePrice, days, nonce.toString()]);
            let hashData = ethers.utils.arrayify(hashMsg);
            let signature = wallet.signMessage(hashData);

            await licenseInstance.registerLicenseWithEthers(claimOwner, claimAddress, licensePrice, days, signature, {
                from: claimReceiver,
                value: payment
            });

            nonce = await licenseInstance.getNonce(claimAddress);
            hashMsg = ethers.utils.solidityKeccak256(['bytes', 'bytes', 'bytes', 'int256', 'int256', 'int256'], [claimOwner, claimReceiver, claimAddress, licensePrice, days, nonce.toString()]);
            hashData = ethers.utils.arrayify(hashMsg);
            signature = wallet.signMessage(hashData);

            await licenseInstance.registerLicenseWithEthers(claimOwner, claimAddress, licensePrice, days, signature, {
                from: claimReceiver,
                value: payment
            });

            let licensesCount = await licenseInstance.getClaimCountPerLicensee(claimReceiver);

            let licenseeAddress = await licenseInstance.getLicenseeClaim(claimReceiver, licensesCount - 1);
            assert.equal(licenseeAddress,claimAddress)
        });
    });

    describe("Testing licenseContract upgradability", () => {

        beforeEach(async () => {
            payment = await ethExchangeOracle.convertUSDToWei(feeInUSD);
            payment = payment.add(licensePrice);
        });

        it("Should keep data stored after upgrade", async () => {
            let ownerBeforeUpgrade = await licenseInstance.getOwner();
            let licenseImplBefore = await licenseInstance.getImplementation();

            // create a license
            const months = 3;
            let days = util.getNextNMontsInDays(months);

            let nonce = await licenseInstance.getNonce(claimAddress);

            const wallet = new ethers.Wallet(sellerPrivateKey);
            const hashMsg = ethers.utils.solidityKeccak256(['bytes', 'bytes', 'bytes', 'int256', 'int256', 'int256'], [claimOwner, claimReceiver, claimAddress, licensePrice, days, nonce.toString()]);
            let hashData = ethers.utils.arrayify(hashMsg);
            const signature = wallet.signMessage(hashData);

            await licenseInstance.registerLicenseWithEthers(claimOwner, claimAddress, licensePrice, days, signature, {
                from: claimReceiver,
                value: payment
            });
            let licenseEndDate = await licenseInstance.getEndDateOfLicense(claimAddress, claimReceiver);
            licenseEndDate = new Date(licenseEndDate * 1000);

            // Deploy new impl
            let ecTools = await ECTools.new();
            IPClaimsLicenseTest.link("ECTools", ecTools.address);
            let ipClaimsLicenseNew = await IPClaimsLicenseTest.new({from: owner});

            //Set new Impls
            await licenseInstance.upgradeImplementation(ipClaimsLicenseNew.address, {from: owner});

            let licenseInstanceAfterUpgrade = await IIPClaimsLicenseTest.at(licenseInstance.address);

            let ownerAfterUpgrade = await licenseInstanceAfterUpgrade.getOwner();
            let licenseImplAfter = await licenseInstanceAfterUpgrade.getImplementation();

            licenseEndDateNew = await licenseInstanceAfterUpgrade.getEndDateOfLicense(claimAddress, claimReceiver);
            licenseEndDateNew = new Date(licenseEndDateNew * 1000);

            assert.strictEqual(ownerBeforeUpgrade, ownerAfterUpgrade, "contract owner is not upgraded correctly");
            assert.notEqual(licenseImplBefore, licenseImplAfter, "licenseContract implementation addresses not match");
            assert.strictEqual(licenseEndDate.toDateString(), licenseEndDateNew.toDateString(), "");
        });

        it("Should add new functionality", async () => {

            let ecTools = await ECTools.new();
            IPClaimsLicenseTest.link("ECTools", ecTools.address);
            let ipClaimsLicenseNew = await IPClaimsLicenseTest.new({from: owner});

            await licenseInstance.upgradeImplementation(ipClaimsLicenseNew.address, {from: owner});

            licenseInstance = await IIPClaimsLicenseTest.at(licenseInstance.address);

            await licenseInstance.setTestAddress(notOwner, {from: owner});

            let testParameter = await licenseInstance.getTestAddress();

            assert.strictEqual(notOwner, testParameter, "test parameter is not set correctly");
        });

        it("Should NOT upgrade if not from owner", async () => {
            let ecTools = await ECTools.new();
            IPClaimsLicenseTest.link("ECTools", ecTools.address);
            let ipClaimsLicenseNew = await IPClaimsLicenseTest.new({from: owner});

            await util.expectThrow(licenseInstance.upgradeImplementation(ipClaimsLicenseNew.address, {from: notOwner}));
        });

    });

});