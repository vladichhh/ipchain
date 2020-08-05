const etherlime = require('etherlime');
const DistributionContract = require('../build/DistributionContract.json')
const MintableToken = require('../build/MintableToken.json')

describe('Distribution', () => {
    let owner = accounts[0];
    let accountsToDistribute = [
        accounts[1].wallet.address,
    ];
    let amountsToDistribute = [
        10,
    ];

    let amountToMint = "100000000000000000000";
    let ERC20Instance;
    let deployer;
    let DistributionContractWrapper;

    const defaultConfigs = {
        gasPrice: 20000000000,
        gasLimit: 4700000
    };

    beforeEach(async () => {
        deployer = new etherlime.EtherlimeGanacheDeployer(owner.secretKey, 8545, defaultConfigs);
        // deployer = new etherlime.InfuraPrivateKeyDeployer('cd15e42323b3c6adf70cdffaf115a0875b0bbfea9378babed53a6cb2d6dd70d8', 'ropsten', 'Up5uvBHSCSqtOmnlhL87');

        ERC20Instance = await deployer.deploy(MintableToken);
        await ERC20Instance.contract.mint(owner.wallet.address, amountToMint);

        DistributionContractWrapper = await deployer.deploy(DistributionContract, {}, ERC20Instance.contractAddress);
        await ERC20Instance.contract.approve(DistributionContractWrapper.contractAddress, amountToMint)
    });

    it('deploy contracts', async function () {
        let contractOwner = await DistributionContractWrapper.contract.owner();
        assert.strictEqual(contractOwner, owner.wallet.address, 'Initial contract owner does not match');
    });

    it('withdraw', async function () {
        initialBalance1 = await ERC20Instance.contract.balanceOf(accountsToDistribute[0]);
        console.log(initialBalance1);
        initialBalance2 = await ERC20Instance.contract.balanceOf("0x3e3935ce5548f38d978f60abd24a85d1e901f8c7");
        initialBalance3 = await ERC20Instance.contract.balanceOf("0x6aa8a4a940f5edb2eff01e12de8d31f5ad50df9b");
        initialBalance4 = await ERC20Instance.contract.balanceOf("0x701c355092f76679b58d94e420d01ebffa415fd0");
        initialBalance5 = await ERC20Instance.contract.balanceOf("0xdadb2e67ed9081846c0bc6b9826d98a539836ec9");
        initialOwnerBalance = await ERC20Instance.contract.balanceOf("0xc600f06141cd6685c59a5f346cdd3c967b18d8df");

        await ERC20Instance.contract.transfer(accountsToDistribute[0], 10);
        console.log("approved");
        console.log(accountsToDistribute);
        console.log(amountsToDistribute);
        await DistributionContractWrapper.contract.distributeTokens(['0xd4Fa489Eacc52BA59438993f37Be9fcC20090E39'], [10]);

        finalBalance1 = await ERC20Instance.contract.balanceOf(accountsToDistribute[0]);
        console.log(finalBalance1);
        finalBalance2 = await ERC20Instance.contract.balanceOf("0x3e3935ce5548f38d978f60abd24a85d1e901f8c7");
        finalBalance3 = await ERC20Instance.contract.balanceOf("0x6aa8a4a940f5edb2eff01e12de8d31f5ad50df9b");
        finalBalance4 = await ERC20Instance.contract.balanceOf("0x701c355092f76679b58d94e420d01ebffa415fd0");
        finalBalance5 = await ERC20Instance.contract.balanceOf("0xdadb2e67ed9081846c0bc6b9826d98a539836ec9");
        finalOwnerBalance = await ERC20Instance.contract.balanceOf("0xc600f06141cd6685c59a5f346cdd3c967b18d8df");

        assert(finalBalance1.eq(initialBalance1.add(amountsToDistribute[0])), "First Account distribution failed");
        assert(finalBalance2.eq(initialBalance2.add(amountsToDistribute[1])), "First Account distribution failed");
        assert(finalBalance3.eq(initialBalance3.add(amountsToDistribute[2])), "First Account distribution failed");
        assert(finalBalance4.eq(initialBalance4.add(amountsToDistribute[3])), "First Account distribution failed");
        assert(finalBalance5.eq(initialBalance5.add(amountsToDistribute[4])), "First Account distribution failed");
        assert(finalOwnerBalance.eq(initialOwnerBalance.sub(115)), "First Account distribution failed");
    })
});