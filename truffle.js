const HDWalletProvider = require("truffle-hdwallet-provider-privkey");

// let testAddress = '0x795EFF09B1FE788DC7e6824AA5221aD893Fd465A';
let testPrivateKey = '2956b7afa2b93c048f2281be59a5d0ecaf247c5f82430a2209143c1e973c5b82';
let infuraRopsten = 'https://ropsten.infura.io/jLCpladxNxIQQ2IbJ2Aw';
let infuraRinkeby = 'https://rinkeby.infura.io/jLCpladxNxIQQ2IbJ2Aw';

module.exports = {

    networks: {
        development: {
            host: "localhost",
            port: 8545,
            gas: 4000000,
            network_id: "*"
        },
        td: {
            host: "localhost",
            port: 9545,
            network_id: "*"
        },
        ganache: {
            host: "localhost",
            port: 7545,
            network_id: "*"
        },
        ropsten: {
            provider: () => new HDWalletProvider(testPrivateKey, infuraRopsten),
            network_id: "3",
            port: 8545,
            gas: 4712387,
            gasPrice: 100000000000
        },
        rinkeby: {
            provider: function () {
                return new HDWalletProvider(testPrivateKey, infuraRinkeby)
            },
            network_id: "4",
            port: 8545,
            gas: 4000000
        }
    },
    solc: {
        optimizer: {
            enabled: true,
            runs: 2000
        }
    },
    mocha: {
        reporter: 'eth-gas-reporter',
        reporterOptions: {
            currency: 'CHF',
            gasPrice: 21
        }
    }
};