const etherlime = require('etherlime');
const DistributionContract = require('../build/DistributionContract.json');
const IpTokenContractAddress = require('../build/IPToken.json');

const defaultConfigs = {
	gasPrice: 10000000000, // 11 gwai
	gasLimit: 3700000
};

// const deploy = async (network, secret) => {
//
//     const deployer = new etherlime.InfuraPrivateKeyDeployer('ddefa246dfa83d5a36fcb974838d149894ec83302fd03453ad77de4c43ac19a1', 'homestead', 'Up5uvBHSCSqtOmnlhL87', defaultConfigs);
//     const result = await deployer.deploy(IpTokenContractAddress);
//     // address: 0x37d78B93db1108AB7DB08C9719348C9Eea376FD1
// };

const deploy = async (network, secret) => {

	const deployer = new etherlime.InfuraPrivateKeyDeployer('ddefa246dfa83d5a36fcb974838d149894ec83302fd03453ad77de4c43ac19a1', 'homestead', 'Up5uvBHSCSqtOmnlhL87', defaultConfigs);
	const result = await deployer.deploy(DistributionContract, {}, "0xDcF90E91764336c5F488B18E1b9cB6A745A2979F");
	// address: 0xFB037189Bf391bAD2044785Dde828c240f42317d
};

module.exports = {
	deploy
};