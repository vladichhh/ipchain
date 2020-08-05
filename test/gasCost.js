const ProjectInitializator = require("./ProjectInitializator");
const MintableToken = artifacts.require("../TestContracts/Token/MintableToken.sol");
const OwnerIPClaims = artifacts.require("./OwnerIPClaims.sol");
const ethers = require('ethers');
const util = require("./util");
const IPClaim = artifacts.require("./IPClaim.sol");


contract("gasCost", function (accounts) {

    const owner = accounts[0];
    const claimOwner = accounts[1];
    const claimBuyer = accounts[2];
    const taxAccount = accounts[4];
    const notOwner = accounts[9];

    const randomIPFS = "QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ";
    let ipfsToBS58 = util.getBytes32FromIpfsHash(randomIPFS);

    let factoryInstance;
    let registryInstance;
    let vaultitudeUpgradableImplsInstance;
    let ERC20Instance;

    let claimAddress;
    let lastClaim;
    let ownerListOfIPClaimsInstance;
    let claimLibraryAddress;

    const sellerPrivateKey = '2030b463177db2da82908ef90fa55ddfcef56e8183caf60db464bc398e736e6f';
    const buyerPrivateKey = 'fac0bc9325ad342033afe956e83f0bf8f1e863c1c3e956bc75d66961fe4cd186';
    const taxFee = "10000000";
    const amountToMint = "999000000000";
    const fakeAmount = "5900";
    const commissionPercetnt = "10";

    const providers = ethers.providers;
    const provider = new providers.JsonRpcProvider();

    beforeEach(async function () {
        ERC20Instance = await MintableToken.new({
            from: owner
        });

        factoryInstance = await ProjectInitializator.initIPClaimsFactory();
        registryInstance = await ProjectInitializator.initIPClaimsRegistry();
        ERC20Instance = await MintableToken.new();
        ipClaimTransferInstance = await ProjectInitializator.initIPClaimTransfer(owner);

        await factoryInstance.initWithParameters(registryInstance.address, {
            from: owner
        });

        await factoryInstance.setIPTokenAddress(ERC20Instance.address, {
            from: owner
        });

        await registryInstance.initWithParameters(factoryInstance.address, ipClaimTransferInstance.address, {
            from: owner
        });

        await ipClaimTransferInstance.initWithParameters(registryInstance.address, ERC20Instance.address, taxAccount, {
            from: owner
        });

        vaultitudeUpgradableImplsInstance = await ProjectInitializator.initVaultitudeUpgradableImpls(owner);

        await registryInstance.setVaultitudeUpgradableImpls(vaultitudeUpgradableImplsInstance.address, {
            from: owner
        });

        let ownerListOfIPClaims = await ProjectInitializator.initOwnerIPClaims();

        await vaultitudeUpgradableImplsInstance.setOwnerIPClaimsAddress(ownerListOfIPClaims, {
            from: owner
        });
        await ipClaimTransferInstance.setCommission(commissionPercetnt);

        // await factoryInstance.createClaim(randomIPFS, {
        //     from: claimOwner
        // });

        await ERC20Instance.mint(claimBuyer, amountToMint);
        await ERC20Instance.approve(ipClaimTransferInstance.address, taxFee, {
            from: claimBuyer
        });
    });

    describe("Testing gas costs", () => {

        // it("creating one claim", async function () {
        //     await factoryInstance.createClaim(randomIPFS, {
        //         from: claimOwner
        //     });
        // });

        // it("creating two claims for one owner", async function () {
        //     await factoryInstance.createClaim(randomIPFS, {
        //         from: claimOwner
        //     });

        //     await factoryInstance.createClaim(randomIPFS, {
        //         from: claimOwner
        //     });
        // });

        // it("Transfering a claim", async function () {
        //     await factoryInstance.createClaim(randomIPFS, {
        //         from: claimOwner
        //     });

        //     claimLibraryAddress = await registryInstance.getListOfIPClaims(claimOwner);
        //     ownerListOfIPClaimsInstance = OwnerIPClaims.at(claimLibraryAddress);

        //     lastClaim = await ownerListOfIPClaimsInstance.getClaimsCount();
        //     claimAddress = await ownerListOfIPClaimsInstance.getClaim(lastClaim);

        //     const wallet = new ethers.Wallet('0x' + sellerPrivateKey);
        //     const hashMsg = ethers.utils.solidityKeccak256(['bytes', 'bytes', 'bytes', 'int'], [claimOwner, claimBuyer, claimAddress, taxFee]);
        //     let hashData = ethers.utils.arrayify(hashMsg);
        //     const signature = wallet.signMessage(hashData);

        //     await ipClaimTransferInstance.transferIPClaimWithTokens(claimOwner, claimAddress, taxFee, signature, {
        //         from: claimBuyer,
        //     });
        // });

        // it("check claim something...", async function () {

        //     claimLibraryAddress = await registryInstance.getListOfIPClaims(claimOwner);
        //     ownerListOfIPClaimsInstance = OwnerIPClaims.at(claimLibraryAddress);

        //     lastClaim = await ownerListOfIPClaimsInstance.getClaimsCount();
        //     claimAddress = await ownerListOfIPClaimsInstance.getClaim(lastClaim);

        //     let claim = IPClaim.at(claimAddress);

        //     await claim.setToPublic({
        //         from: claimOwner
        //     });
        // });
    });
});