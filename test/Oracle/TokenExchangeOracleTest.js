const TokenExchangeOracle = artifacts.require("./TokenExchangeOracle.sol");


contract('TokenExchangeOracle', (accounts) => {

    const ONE_ETHER_IN_WEI = 1000000000000000000;

    const admin = accounts[1];

    const _initialRateMultiplier = 1000;
    const _initialUSDMultiplier = 100;

    let instance;

    describe('converting USD amount in tokens', () => {

        let initialRate;

        describe('calculating tokens for given USD amount [Token/USD > 1]', () => {

            initialRate = 250000; // equals to 250.000 (Token/USD)

            beforeEach(async () => {
                instance = await TokenExchangeOracle.new(admin, initialRate);
            });

            it('should calculate tokens for floating USD amount', async () => {
                let usdAmount = 3999; // equal to 39.99 USD

                let calculatedTokens = await instance.convertUSDToTokens(usdAmount);
                let expectedTokens = ( usdAmount * _initialRateMultiplier * ONE_ETHER_IN_WEI ) / (_initialUSDMultiplier * initialRate);

                assert(calculatedTokens.eq(expectedTokens), "Calculated token amount does not match to the expected");
            });

            it('should calculate tokens for integer USD amount', async () => {
                let usdAmount = 50000; // equal to 500 USD

                let calculatedTokens = await instance.convertUSDToTokens(usdAmount);
                let expectedTokens = ( usdAmount * _initialRateMultiplier * ONE_ETHER_IN_WEI ) / (_initialUSDMultiplier * initialRate);

                assert(calculatedTokens.eq(expectedTokens), "Calculated token amount does not match to the expected");
            });

        });

        describe('calculating tokens for given USD amount [Token/USD = 1]', () => {

            initialRate = 1000; // equals to 1 (Token/USD)

            beforeEach(async () => {
                instance = await TokenExchangeOracle.new(admin, initialRate);
            });

            it('should calculate tokens for floating USD amount', async () => {
                let usdAmount = 3999; // equal to 39.99 USD

                let calculatedTokens = await instance.convertUSDToTokens(usdAmount);
                let expectedTokens = (usdAmount * _initialRateMultiplier * ONE_ETHER_IN_WEI) / (_initialUSDMultiplier * initialRate);

                assert(calculatedTokens.eq(expectedTokens), "Calculated token amount does not match to the expected");
            });

            it('should calculate tokens for integer USD amount', async () => {
                let usdAmount = 50000; // equal to 500 USD

                let calculatedTokens = await instance.convertUSDToTokens(usdAmount);
                let expectedTokens = (usdAmount * _initialRateMultiplier * ONE_ETHER_IN_WEI) / (_initialUSDMultiplier * initialRate);

                assert(calculatedTokens.eq(expectedTokens), "Calculated token amount does not match to the expected");
            });

        });

        describe('calculating tokens for given USD amount [Token/USD < 1]', () => {

            initialRate = 1; // equals to 0.001 (Token/USD)

            beforeEach(async () => {
                instance = await TokenExchangeOracle.new(admin, initialRate);
            });

            it('should calculate tokens for floating USD amount', async () => {
                let usdAmount = 3999; // equal to 39.99 USD

                let calculatedTokens = await instance.convertUSDToTokens(usdAmount);
                let expectedTokens = (usdAmount * _initialRateMultiplier * ONE_ETHER_IN_WEI) / (_initialUSDMultiplier * initialRate);

                assert(calculatedTokens.eq(expectedTokens), "Calculated token amount does not match to the expected");
            });

            it('should calculate tokens for integer USD amount', async () => {
                let usdAmount = 50000; // equal to 500 USD

                let calculatedTokens = await instance.convertUSDToTokens(usdAmount);
                let expectedTokens = (usdAmount * _initialRateMultiplier * ONE_ETHER_IN_WEI) / (_initialUSDMultiplier * initialRate);

                assert(calculatedTokens.eq(expectedTokens), "Calculated token amount does not match to the expected");
            });

        });

    });

    describe('converting USD amount in tokens [by lastRate]', () => {

        let initialRate = 250000; // equals to 250.000 (Token/USD)
        let newRate = 200000; // equals to 200.000 (Token/USD)

        beforeEach(async () => {
            instance = await TokenExchangeOracle.new(admin, initialRate);
            await instance.setRate(newRate, {from: admin});
        });

        it('should calculate tokens for floating USD amount', async () => {
            let usdAmount = 3999; // equal to 39.99 USD

            let calculatedTokens = await instance.convertUSDToTokensByLastRate(usdAmount);
            let expectedTokens = (usdAmount * _initialRateMultiplier * ONE_ETHER_IN_WEI) / (_initialUSDMultiplier * initialRate);

            assert(calculatedTokens.eq(expectedTokens), "Calculated token amount does not match to the expected");
        });

        it('should calculate tokens for integer USD amount', async () => {
            let usdAmount = 50000; // equal to 500 USD

            let calculatedTokens = await instance.convertUSDToTokensByLastRate(usdAmount);
            let expectedTokens = (usdAmount * _initialRateMultiplier * ONE_ETHER_IN_WEI) / (_initialUSDMultiplier * initialRate);

            assert(calculatedTokens.eq(expectedTokens), "Calculated token amount does not match to the expected");
        });

    });

    describe('converting tokens in USD', () => {

        let initialRate = 250000; // equals to 250.000 (Token/USD)

        beforeEach(async () => {
            instance = await TokenExchangeOracle.new(admin, initialRate);
        });

        it('should calculate USD for tokens equals to 39.99 USD', async () => {
            let tokens = 159960000000000000; // equals to 39.99 USD

            let calculatedUSD = await instance.convertTokensToUSD(tokens);
            let expectedUSD = (tokens * _initialUSDMultiplier * initialRate) / (_initialRateMultiplier * ONE_ETHER_IN_WEI);

            assert(calculatedUSD.eq(expectedUSD), "Calculated USD amount does not match to the expected");
        });


        it('should calculate USD for tokens equals to 500 USD', async () => {
            let tokens = 2000000000000000000; // equals to 500 USD

            let calculatedUSD = await instance.convertTokensToUSD(tokens);
            let expectedUSD = (tokens * _initialUSDMultiplier * initialRate) / (_initialRateMultiplier * ONE_ETHER_IN_WEI);

            assert(calculatedUSD.eq(expectedUSD), "Calculated USD amount does not match to the expected");
        });

    });

    describe('converting tokens in USD [by lastRate]', () => {

        let initialRate = 250000; // equals to 250.000 (Token/USD)
        let newRate = 200000; // equals to 200.000 (Token/USD)

        beforeEach(async () => {
            instance = await TokenExchangeOracle.new(admin, initialRate);
            await instance.setRate(newRate, {from: admin});
        });

        it('should calculate USD for tokens equals to 39.99 USD', async () => {
            let tokens = 159960000000000000; // equals to 39.99 USD

            let calculatedUSD = await instance.convertTokensToUSDByLastRate(tokens);
            let expectedUSD = (tokens * _initialUSDMultiplier * initialRate) / (_initialRateMultiplier * ONE_ETHER_IN_WEI);

            assert(calculatedUSD.eq(expectedUSD), "Calculated USD amount does not match to the expected");
        });


        it('should calculate USD for tokens equals to 500 USD', async () => {
            let tokens = 2000000000000000000; // equals to 500 USD

            let calculatedUSD = await instance.convertTokensToUSDByLastRate(tokens);
            let expectedUSD = (tokens * _initialUSDMultiplier * initialRate) / (_initialRateMultiplier * ONE_ETHER_IN_WEI);

            assert(calculatedUSD.eq(expectedUSD), "Calculated USD amount does not match to the expected");
        });

    });

});