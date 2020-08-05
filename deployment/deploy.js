const etherlime = require("etherlime");

const config = require("./config");

const IPClaimsTransfer = require("./../build/IPClaimsTransfer");

const defaultConfigs = {
    gasLimit: 5500000,
    gasPrice: 10000000000 // 10Gwei
};


const deploy = async (network, secret) => {

    const secretLoc = "";
    const networkLoc = "homestead";

    let deployer = new etherlime.InfuraPrivateKeyDeployer(secretLoc, networkLoc, config.infuraAPIKey);
    deployer.defaultOverrides = defaultConfigs;

    /*
     * IPClaimsTransfer
     */
    let ipClaimsTransfer = await deployer.deploy(IPClaimsTransfer, {"ECTools": "0xE32A5D87E6eA8fA109f6273928bcD9b17390247b"});
};

module.exports = {
    deploy
};