let readlineSync = require('readline-sync');

const ethers = require('ethers');
const config = require("./config");

let localNodeProvider;

if (config.network === 'local') {
    localNodeProvider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
} else {
    localNodeProvider = new ethers.providers.InfuraProvider(ethers.providers.networks[config.network], config.infuraAPIKey);
}

let provider = new ethers.providers.FallbackProvider([
    localNodeProvider
]);

let initWallet = async () => {
    // const privateKey = readlineSync.question('Enter your privateKey here: ');
    const privateKey = "7ab741b57e8d94dd7e1a29055646bafde7010f38a900f55bbd7647880faa6ee8"; //rpc
    // const privateKey = '2956b7afa2b93c048f2281be59a5d0ecaf247c5f82430a2209143c1e973c5b82'; // testNet
    let wallet = new ethers.Wallet('0x' + privateKey);
    wallet.provider = provider;

    return wallet;
};

let runDeployment = async (wallet, txnToDeploy, contractName) => {
    txnToDeploy.gasLimit = config.gasLimit;
    txnToDeploy.gasPrice = config.gasPrice;

    let deploymentTxn = await wallet.sendTransaction(txnToDeploy);
    console.log("\nDeploying " + contractName + ": " + deploymentTxn.hash);

    await localNodeProvider.waitForTransaction(deploymentTxn.hash);
    const receipt = await localNodeProvider.getTransactionReceipt(deploymentTxn.hash);

    if (receipt.status === 0) {
        throw new Error("Transaction failed: ", receipt.transactionHash);
    }

    console.log(contractName + ": " + receipt.contractAddress);

    return receipt.contractAddress;
};

module.exports = {runDeployment, initWallet, localNodeProvider};