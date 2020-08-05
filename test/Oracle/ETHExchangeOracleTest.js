const ETHExchangeOracle = artifacts.require("./ETHExchangeOracle.sol");


contract('ETHExchangeOracle', (accounts) => {

    const ONE_ETHER_IN_WEI = 1000000000000000000;

    const admin = accounts[1];

    const _initialRateMultiplier = 1000;
    const _initialUSDMultiplier = 100;

    let instance;
    let initialRate;

    describe('converting USD amount in wei', () => {

        describe('calculating wei for given USD amount [ETH/USD > 1]', () => {

            initialRate = 250000; // equals to 250.000 (ETH/USD)

            beforeEach(async () => {
                instance = await ETHExchangeOracle.new(admin, initialRate);
            });

            it('should calculate wei for floating USD amount', async () => {
                let usdAmount = 3999; // equal to 39.99 USD

                let calculatedWei = await instance.convertUSDToWei(usdAmount);
                let expectedWei = ( usdAmount * _initialRateMultiplier * ONE_ETHER_IN_WEI ) / (_initialUSDMultiplier * initialRate);

                assert(calculatedWei.eq(expectedWei), "Calculated wei amount does not match to the expected");
            });

            it('should calculate wei for integer USD amount', async () => {
                let usdAmount = 50000; // equal to 500 USD

                let calculatedWei = await instance.convertUSDToWei(usdAmount);
                let expectedWei = ( usdAmount * _initialRateMultiplier * ONE_ETHER_IN_WEI ) / (_initialUSDMultiplier * initialRate);

                assert(calculatedWei.eq(expectedWei), "Calculated wei amount does not match to the expected");
            });

        });

        describe('calculating wei for given USD amount [ETH/USD = 1]', () => {

            initialRate = 1000; // equals to 1 (ETH/USD)

            beforeEach(async () => {
                instance = await ETHExchangeOracle.new(admin, initialRate);
            });

            it('should calculate wei for floating USD amount', async () => {
                let usdAmount = 3999; // equal to 39.99 USD

                let calculatedWei = await instance.convertUSDToWei(usdAmount);
                let expectedWei = (usdAmount * _initialRateMultiplier * ONE_ETHER_IN_WEI) / (_initialUSDMultiplier * initialRate);

                assert(calculatedWei.eq(expectedWei), "Calculated wei amount does not match to the expected");
            });

            it('should calculate wei for integer USD amount', async () => {
                let usdAmount = 50000; // equal to 500 USD

                let calculatedWei = await instance.convertUSDToWei(usdAmount);
                let expectedWei = (usdAmount * _initialRateMultiplier * ONE_ETHER_IN_WEI) / (_initialUSDMultiplier * initialRate);

                assert(calculatedWei.eq(expectedWei), "Calculated wei amount does not match to the expected");
            });

        });

        describe('calculating wei for given USD amount [ETH/USD < 1]', () => {

            initialRate = 1; // equals to 0.001 (ETH/USD)

            beforeEach(async () => {
                instance = await ETHExchangeOracle.new(admin, initialRate);
            });

            it('should calculate wei for floating USD amount', async () => {
                let usdAmount = 3999; // equal to 39.99 USD

                let calculatedWei = await instance.convertUSDToWei(usdAmount);
                let expectedWei = (usdAmount * _initialRateMultiplier * ONE_ETHER_IN_WEI) / (_initialUSDMultiplier * initialRate);

                assert(calculatedWei.eq(expectedWei), "Calculated wei amount does not match to the expected");
            });

            it('should calculate wei for integer USD amount', async () => {
                let usdAmount = 50000; // equal to 500 USD

                let calculatedWei = await instance.convertUSDToWei(usdAmount);
                let expectedWei = (usdAmount * _initialRateMultiplier * ONE_ETHER_IN_WEI) / (_initialUSDMultiplier * initialRate);

                assert(calculatedWei.eq(expectedWei), "Calculated wei amount does not match to the expected");
            });

        });

    });

    describe('converting USD amount in wei [by lastRate]', () => {

        let initialRate = 250000; // equals to 250.000 (ETH/USD)
        let newRate = 200000; // equals to 200.000 (ETH/USD)

        beforeEach(async () => {
            instance = await ETHExchangeOracle.new(admin, initialRate);
            await instance.setRate(newRate, {from: admin});
        });

        it('should calculate wei for floating USD amount', async () => {
            let usdAmount = 3999; // equal to 39.99 USD

            let calculatedWei = await instance.convertUSDToWeiByLastRate(usdAmount);
            let expectedWei = (usdAmount * _initialRateMultiplier * ONE_ETHER_IN_WEI) / (_initialUSDMultiplier * initialRate);

            assert(calculatedWei.eq(expectedWei), "Calculated wei amount does not match to the expected");
        });

        it('should calculate wei for integer USD amount', async () => {
            let usdAmount = 50000; // equal to 500 USD

            let calculatedWei = await instance.convertUSDToWeiByLastRate(usdAmount);
            let expectedWei = (usdAmount * _initialRateMultiplier * ONE_ETHER_IN_WEI) / (_initialUSDMultiplier * initialRate);

            assert(calculatedWei.eq(expectedWei), "Calculated wei amount does not match to the expected");
        });

    });

    describe('converting wei amount in USD', () => {

        let initialRate = 250000; // equals to 250.000 (ETH/USD);

        beforeEach(async () => {
            instance = await ETHExchangeOracle.new(admin, initialRate);
        });

        it('should calculate USD for wei amount equals to 39.99 USD', async () => {
            let weiAmount = 159960000000000000; // equals to 39.99 USD

            let calculatedUSD = await instance.convertWeiToUSD(weiAmount);
            let expectedUSD = (weiAmount * _initialUSDMultiplier * initialRate) / (_initialRateMultiplier * ONE_ETHER_IN_WEI);

            assert(calculatedUSD.eq(expectedUSD), "Calculated USD amount does not match to the expected");
        });


        it('should calculate USD for wei amount equals to 500 USD', async () => {
            let weiAmount = 2000000000000000000; // equals to 500 USD

            let calculatedUSD = await instance.convertWeiToUSD(weiAmount);
            let expectedUSD = (weiAmount * _initialUSDMultiplier * initialRate) / (_initialRateMultiplier * ONE_ETHER_IN_WEI);

            assert(calculatedUSD.eq(expectedUSD), "Calculated USD amount does not match to the expected");
        });

    });

    describe('converting wei amount in USD [by lastRate]', () => {

        let initialRate = 250000; // equals to 250.000 (ETH/USD);
        let newRate = 200000; // equals to 200.000 (ETH/USD)

        beforeEach(async () => {
            instance = await ETHExchangeOracle.new(admin, initialRate);
            await instance.setRate(newRate, {from: admin});
        });

        it('should calculate USD for wei amount equals to 39.99 USD', async () => {
            let weiAmount = 159960000000000000; // equals to 39.99 USD

            let calculatedUSD = await instance.convertWeiToUSDByLastRate(weiAmount);
            let expectedUSD = (weiAmount * _initialUSDMultiplier * initialRate) / (_initialRateMultiplier * ONE_ETHER_IN_WEI);

            assert(calculatedUSD.eq(expectedUSD), "Calculated USD amount does not match to the expected");
        });


        it('should calculate USD for wei amount equals to 500 USD', async () => {
            let weiAmount = 2000000000000000000; // equals to 500 USD

            let calculatedUSD = await instance.convertWeiToUSDByLastRate(weiAmount);
            let expectedUSD = (weiAmount * _initialUSDMultiplier * initialRate) / (_initialRateMultiplier * ONE_ETHER_IN_WEI);

            assert(calculatedUSD.eq(expectedUSD), "Calculated USD amount does not match to the expected");
        });

    });

});