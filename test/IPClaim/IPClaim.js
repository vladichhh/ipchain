const IPClaim = artifacts.require("./IPClaim.sol");
const OwnerIPClaims = artifacts.require("./OwnerIPClaims.sol");
const ProjectInitializator = require("../ProjectInitializator");
const util = require("../util");
const erc20Instance = artifacts.require("../TestContracts/Token/MintableToken.sol");
const TokenExchangeOracle = artifacts.require("./TokenExchangeOracle.sol");


contract("IPClaim", (accounts) => {

    const owner = accounts[0];
    const claimOwner = accounts[1];
    const oracleAdmin = accounts[5];
    const factory = accounts[6];
    const registry = accounts[7];
    const feeReceiver = accounts[8];
    const notOwner = accounts[9];

    const randomIPFS = "QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ";
    let ipfsToBS58 = util.getBytes32FromIpfsHash(randomIPFS);
    let priceForCreatingPrivateClaim = "1000";
    let typePrices = ["2000", "3000", "4000", "5000"];
    let typePricesForPublish = ["2000", "3000", "4000", "5000"];
    let claimType = "3";
    const exchangeRate = "226020";
    const amountToMint = "20000000000000000000"; // 20 ETH

    let factoryInstance;
    let registryInstance;
    let vaultitudeUpgradableImplsInstance;
    let ERC20Instance;
    let tokenExchangeOracle;
    let ipClaimsTransferInstance;

    describe("Testing IPClaim contract", () => {

        beforeEach(async () => {
            factoryInstance = await ProjectInitializator.initIPClaimsFactory();
            registryInstance = await ProjectInitializator.initIPClaimsRegistry();
            ERC20Instance = await erc20Instance.new({from: owner});
            tokenExchangeOracle = await TokenExchangeOracle.new(oracleAdmin, exchangeRate);
            ipClaimsTransferInstance = await ProjectInitializator.initIPClaimsTransfer(owner);

            await factoryInstance.initWithParameters(registryInstance.address, ERC20Instance.address, feeReceiver,
                tokenExchangeOracle.address, priceForCreatingPrivateClaim, typePrices, typePricesForPublish, {from: owner});

            await registryInstance.initWithParameters(factoryInstance.address, ipClaimsTransferInstance.address, {from: owner});

            vaultitudeUpgradableImplsInstance = await ProjectInitializator.initVaultitudeUpgradableImpls(owner);

            await registryInstance.setVaultitudeUpgradableImpls(vaultitudeUpgradableImplsInstance.address, {from: owner});

            let ownerListOfIPClaims = await ProjectInitializator.initOwnerIPClaims();

            await vaultitudeUpgradableImplsInstance.setOwnerIPClaimsAddress(ownerListOfIPClaims, {from: owner});
        });

        it("Should create a Claim Contract with correct values", async () => {
            let isPublic = true;
            let payment = await tokenExchangeOracle.convertUSDToTokens(typePrices[claimType]);

            await ERC20Instance.mint(claimOwner, amountToMint);
            await ERC20Instance.approve(factoryInstance.address, payment, {from: claimOwner});

            await factoryInstance.createPublicClaim(ipfsToBS58, claimType, {from: claimOwner});
            let timeNow = web3.eth.getBlock(web3.eth.blockNumber).timestamp;

            let claimLibraryAddress = await registryInstance.getOwnerIPClaims(claimOwner);
            let ownerListOfIPClaims = OwnerIPClaims.at(claimLibraryAddress);

            let lastClaim = await ownerListOfIPClaims.getClaimsCount();
            let claimAddress = await ownerListOfIPClaims.getClaim(lastClaim - 1);
            let claim = IPClaim.at(claimAddress);

            let _claimOwner = await claim.owner();
            let timestamp = await claim.dateCreated();
            let ipfsAddress = await claim.publicIPFSAddress();
            let bytesToIpfsHash = util.getIpfsHashFromBytes32(ipfsAddress);
            let ipClaimsRegistryInstance = await claim.registry();

            assert.strictEqual(lastClaim.toNumber(), 1, "claim Count is not correct");
            assert.strictEqual(_claimOwner, claimOwner, "the owner is not the right one");
            assert.strictEqual(timestamp.toNumber(), timeNow, "timestamp is not set correctly");
            assert.strictEqual(bytesToIpfsHash, randomIPFS, "the ipfsAddress is not set correctly");
            assert.strictEqual(ipClaimsRegistryInstance, registryInstance.address, "the registry address is not correct");
        });

        it("Should create а claim", async () => {
            let isPublic = true;
            let claim = await IPClaim.new(claimOwner, ipfsToBS58, ipfsToBS58, claimType, isPublic, registryInstance.address, factoryInstance.address);
            let timeNow = web3.eth.getBlock(web3.eth.blockNumber).timestamp;

            let _claimOwner = await claim.owner();
            let timestamp = await claim.dateCreated();
            let publicIPFSdress = await claim.publicIPFSAddress();
            let privateIPFSdress = await claim.privateIPFSAddress();

            let publicBytesToIpfsHash = util.getIpfsHashFromBytes32(publicIPFSdress);
            let privateBytesToIpfsHash = util.getIpfsHashFromBytes32(privateIPFSdress);
            let ipClaimsRegistryInstance = await claim.registry();
            let ipClaimsFactoryInstance = await claim.factory();
            let _claimType = await claim.claimType();

            assert.strictEqual(_claimOwner, claimOwner, "the owner is not the right one");
            assert.strictEqual(timestamp.toNumber(), timeNow, "timestamp is not set correctly");
            assert.strictEqual(publicBytesToIpfsHash, publicBytesToIpfsHash, "the ipfsAddress is not set correctly");
            assert.strictEqual(privateBytesToIpfsHash, privateBytesToIpfsHash, "the ipfsAddress is not set correctly");
            assert.strictEqual(ipClaimsRegistryInstance, registryInstance.address, "the registry address is not correct");
            assert.strictEqual(ipClaimsFactoryInstance, factoryInstance.address, "the factory address is not correct");
            assert.strictEqual(_claimType.toString(), claimType, "claim type is not correct");
        });

        it("Should transfer ownership if called from registry", async () => {
            let isPublic = true;
            let ipClaim = await IPClaim.new(claimOwner, ipfsToBS58, ipfsToBS58, claimType, isPublic, registry, factory);
            await ipClaim.changeOwner(notOwner, {from: registry});
            let newOwner = await ipClaim.owner();
            assert.strictEqual(newOwner, notOwner)
        });

        it("Should NOT transfer ownership if called not from owner", async () => {
            let isPublic = true;
            let ipClaim = await IPClaim.new(claimOwner, ipfsToBS58, ipfsToBS58, claimType, isPublic, registry, factory);
            await util.expectThrow(ipClaim.changeOwner(notOwner, {from: notOwner}));
        });
    })
});