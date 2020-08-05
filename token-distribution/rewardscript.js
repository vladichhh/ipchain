const ethers = require('ethers');
var fs = require('fs');
var parse = require('csv-parse');
var csvWriter = require('csv-write-stream');
const sha3 = require('sha3');

const Contract = ethers.Contract;
const Wallet = ethers.Wallet;
const utils = ethers.utils;
const providers = ethers.providers;

const DistributionContractJSON = require('./build/DistributionContract.json');
const LocTokenContractJSON = require('./build/MintableToken.json');

const DistributionAddress = '0xa2946573F545d8c21484A6D4C3d96d01e81216Ea';

// TODO Add correct infura node
const localNodeProvider = new providers.JsonRpcProvider('https://mainnet.infura.io/Up5uvBHSCSqtOmnlhL87', ethers.providers.networks.mainnet);
// const localNodeProvider = new providers.JsonRpcProvider('http://localhost:8545');
const provider = new providers.FallbackProvider([
    localNodeProvider
]);

let readReceivers = () => {

    return new Promise((resolve, reject) => {
        var csvData = [];
        fs.createReadStream('rewards.csv')
            .pipe(parse({
                delimiter: ';'
            }))
            .on('data', function (csvrow) {
                const r = csvrow[0];
                const a = csvrow[1];
                csvData.push({
                    address: r,
                    amount: a
                });
            })
            .on('end', function () {
                resolve(csvData);

            });
    })
};

let run = async () => {
    // TODO Change private key with the one of the correct sender account
    const privateKey = '7ab741b57e8d94dd7e1a29055646bafde7010f38a900f55bbd7647880faa6ee8';
    // const privateKey = '7ab741b57e8d94dd7e1a29055646bafde7010f38a900f55bbd7647880faa6ee8'; // Localhost
    const receivers = await readReceivers();
    let receipts = [];


    const wallet = new Wallet('0x' + privateKey);
    wallet.provider = provider;

    const DistributionContract = new ethers.Contract(DistributionAddress, DistributionContractJSON.abi, wallet);

    let startfrom = 0 * 100;
    const receiptsAtATime = 100;

    let nonceNumber = await provider.getTransactionCount(wallet.address);
    let id = 1;

    for (let k = 0; k < 3600; k++) {
        const res = await new Promise(async (resolve, reject) => {

            const r = [];
            let limit = receiptsAtATime;
            let currentReceivers = []
            let currentAmounts = [];
            let addresses = []
            let j = 0


            for (let i = startfrom; i < (startfrom + receiptsAtATime); i++) {
                if (i >= receivers.length) {
                    limit = receivers.length % receiptsAtATime;
                    break;
                }

                currentReceivers.push(receivers[i]);
                addresses.push(currentReceivers[j].address.toLowerCase());
                currentAmounts.push(currentReceivers[j].amount.toString());

                j++;
            }

            try {
                if (addresses.length === 0) {
                    throw new Error("No more addresses - END")
                }
                // TODO Change gasPrice if needed
                let gasPrice = 7000000000; // 7 GWei
                let gasLimit = 4700000;
                let overrideOptions = {
                    gasLimit: gasLimit,
                    gasPrice: gasPrice,
                    nonce: nonceNumber++
                };

                console.log("Processing: --- " + addresses.length + " --- addresses to distribute");

                const receipt = await DistributionContract.distributeTokens(
                    addresses,
                    currentAmounts,
                    overrideOptions
                );
                await wallet.provider.waitForTransaction(receipt.hash);
                r.push(
                    currentReceivers
                );

                let writer = await csvWriter({
                    sendHeaders: false
                });
                await writer.pipe(fs.createWriteStream('result.csv', {
                    flags: 'a'
                }));
                await writer.write({
                    id: id++,
                    address: addresses,
                    amounts: currentAmounts,
                    txnHash: receipt.hash
                });
                await writer.end();
                console.log("TxnHash:", receipt.hash);

                if (currentReceivers.length == limit) {
                    resolve(currentReceivers);
                }
            } catch (err) {
                console.log(err);
                limit--;
                if (r.length == limit) {
                    await writer.end();
                    resolve(r);
                }
            }
            ;
            // }
            startfrom += receiptsAtATime;
        });
        if (res) {
            receipts = receipts.concat(res);
        }
    }
};


run();