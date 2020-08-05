const IVaultitudeUpgradableImplsTest = artifacts.require("./IVaultitudeUpgradableImplsTest.sol");
const VaultitudeUpgradableImplsTest = artifacts.require("./VaultitudeUpgradableImplsTest.sol");
const ProjectInitializator = require("../ProjectInitializator");
const util = require("../util");


contract("VaultitudeUpgradableImpls", (accounts) => {

    const owner = accounts[0];
    const notOwner = accounts[9];

    let vaultitudeInstance;

    describe("Testing upgradability", () => {

        beforeEach(async () => {
            vaultitudeInstance = await ProjectInitializator.initVaultitudeUpgradableImpls(owner);
        });

        it("Should not accept empty address for ownerIPClaims", async () => {
            await util.expectThrow(vaultitudeInstance.setOwnerIPClaimsAddress("0x0", {from: owner}));
        });

        it("Should keep data stored after upgrade", async () => {
            vaultitudeInstance.setOwnerIPClaimsAddress(notOwner, {from: owner});

            let vaultitudeImplBefore = await vaultitudeInstance.getImplementation();
            let ownerIPClaimsAddressBefore = await vaultitudeInstance.getOwnerIPClaimsAddress();

            let vaultitudeUpgradableImplsTest = await VaultitudeUpgradableImplsTest.new({from: owner});

            await vaultitudeInstance.upgradeImplementation(vaultitudeUpgradableImplsTest.address, {from: owner});

            vaultitudeInstance = await IVaultitudeUpgradableImplsTest.at(vaultitudeInstance.address, {from: owner});

            let vaultitudeImplAfter = await vaultitudeInstance.getImplementation();
            let ownerIPClaimsAddressAfter = await vaultitudeInstance.getOwnerIPClaimsAddress();

            assert.notEqual(vaultitudeImplBefore, vaultitudeImplAfter, "vaultitude implementation addresses should not match");
            assert.strictEqual(ownerIPClaimsAddressBefore, ownerIPClaimsAddressAfter, "the data was not saved after upgrade");
        });

        it("Should add new functionality", async () => {
            let testParam = 1231254315;

            let vaultitudeUpgradableImplsTest = await VaultitudeUpgradableImplsTest.new({from: owner});

            await vaultitudeInstance.upgradeImplementation(vaultitudeUpgradableImplsTest.address, {from: owner});

            vaultitudeInstance = await IVaultitudeUpgradableImplsTest.at(vaultitudeInstance.address, {from: owner});

            await vaultitudeInstance.setTestParam(testParam);

            let _testParam = await vaultitudeInstance.getTestParam();

            assert.strictEqual(testParam, _testParam.toNumber());
        });

        it("Should NOT upgrade if not from owner", async () => {
            let vaultitudeUpgradableImplsTest = await VaultitudeUpgradableImplsTest.new();

            await util.expectThrow(vaultitudeInstance.upgradeImplementation(vaultitudeUpgradableImplsTest.address, {from: notOwner}));
        });

    });

});