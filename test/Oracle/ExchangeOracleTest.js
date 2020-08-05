const ExchangeOracle = artifacts.require("./ExchangeOracle.sol");
const util = require('./../util');


contract('ExchangeOracle', (accounts) => {

    const _owner = accounts[0];
    const _notOwner = accounts[1];
    const _admin = accounts[2];
    const _notAdmin = accounts[3];
    const _newAdmin = accounts[4];

    const _initialRate = 100000; // 100 rate
    const _initialRateMultiplier = 1000;
    const _initialUSDMultiplier = 100;

    const _newRate = 50000; // 50 rate
    const _newRateMultiplier = 100;
    const _newUSDMultiplier = 10;

    let instance;

    describe("creating contract", () => {

        it("should deploy contract successfully", async () => {
            instance = await ExchangeOracle.new(_admin, _initialRate);
            assert.isDefined(instance, "Could not deploy contract");
        });

    });

    describe("constructor", () => {

        beforeEach(async () => {
            instance = await ExchangeOracle.new(_admin, _initialRate);
        });

        it("should set the contract owner correctly", async () => {
            let owner = await instance.owner();
            assert.strictEqual(owner, _owner, "The initial contract owner was not set correctly");
        });

        it("should set the initial rate correctly", async () => {
            let rate = await instance.rate();
            assert(rate.eq(_initialRate), "The initial rate was not set correctly");
        });

        it("should set the initial last rate correctly", async () => {
            let lastRate = await instance.lastRate();
            assert(lastRate.eq(_initialRate), "The initial last rate was not set correctly");
        });

        it("should set the initial rateMultiplier correctly", async () => {
            let rateMultiplier = await instance.rateMultiplier();
            assert(rateMultiplier.eq(_initialRateMultiplier), "The initial rateMultiplier was not set correctly");
        });

        it("should set the initial usdMultiplier correctly", async () => {
            let usdMultiplier = await instance.usdMultiplier();
            assert(usdMultiplier.eq(_initialUSDMultiplier), "The initial usdMultiplier was not set correctly");
        });

        it("should set the owner as initial admin correctly", async () => {
            let admin = await instance.admin();
            assert.strictEqual(admin, _admin, "The initial admin was not set correctly");
        });

    });

    describe("changing rate", () => {

        beforeEach(async () => {
            instance = await ExchangeOracle.new(_admin, _initialRate);
        });

        it("should change the rate correctly", async () => {
            await instance.setRate(_newRate, {from: _admin});
            let rate = await instance.rate();
            assert(rate.eq(_newRate), "The new rate was not changed correctly");
        });

        it("should change the last rate correctly", async () => {
            await instance.setRate(_newRate, {from: _admin});
            let _rate = await instance.rate();
            await instance.setRate(_newRate, {from: _admin});
            let lastRate = await instance.lastRate();
            assert(lastRate.eq(_rate), "The last rate was not changed correctly");
        });

        it("should emit event on change", async () => {
            const expectedEvent = 'RateChanged';
            let result = await instance.setRate(_newRate, {from: _admin});

            assert.lengthOf(result.logs, 1, "There should be 1 event emitted from setRate!");
            assert.strictEqual(result.logs[0].event, expectedEvent,
                `The event emitted was ${result.logs[0].event} instead of ${expectedEvent}`);
        });

        it("should throw if not admin tries to change", async () => {
            await util.expectThrow(instance.setRate(_newRate, {from: _notAdmin}));
        });

        it("should throw if newRate equals to zero", async () => {
            await util.expectThrow(instance.setRate(0, {from: _admin}));
        });

    });

    describe("changing rateMultiplier", () => {

        beforeEach(async () => {
            instance = await ExchangeOracle.new(_admin, _initialRate);
        });

        it("should change the rateMultiplier correctly", async () => {
            await instance.setRateMultiplier(_newRateMultiplier, {from: _admin});
            const rateMultiplier = await instance.rateMultiplier();
            assert(rateMultiplier.eq(_newRateMultiplier), "The rateMultiplier was not changed correctly");
        });

        it("should emit event on change rateMultiplier", async () => {
            const expectedEvent = "RateMultiplierChanged";
            let result = await instance.setRateMultiplier(_newRateMultiplier, {from: _admin});

            assert.lengthOf(result.logs, 1, "There should be 1 event emitted from setRateMultiplier!");
            assert.strictEqual(result.logs[0].event, expectedEvent,
                `The event emitted was ${result.logs[0].event} instead of ${expectedEvent}`);
        });

        it("should throw if not admin tries to change", async () => {
            await util.expectThrow(instance.setRateMultiplier(_newRateMultiplier, {from: _notAdmin}));
        });

        it("should throw if newRateMultiplier equals to zero", async () => {
            await util.expectThrow(instance.setRateMultiplier(0, {from: _admin}));
        });

    });

    describe("changing usdMultiplier", () => {

        beforeEach(async () => {
            instance = await ExchangeOracle.new(_admin, _initialRate);
        });

        it("should change the usdMultiplier correctly", async () => {
            await instance.setUSDMultiplier(_newUSDMultiplier, {from: _admin});
            const usdMultiplier = await instance.usdMultiplier();
            assert(usdMultiplier.eq(_newUSDMultiplier), "The usdMultiplier was not changed correctly");
        });

        it("should emit event on change usdMultiplier", async () => {
            const expectedEvent = "USDMultiplierChanged";
            let result = await instance.setUSDMultiplier(_newUSDMultiplier, {from: _admin});

            assert.lengthOf(result.logs, 1, "There should be 1 event emitted from setUSDMultiplier!");
            assert.strictEqual(result.logs[0].event, expectedEvent,
                `The event emitted was ${result.logs[0].event} instead of ${expectedEvent}`);
        });

        it("should throw if not admin tries to change", async () => {
            await util.expectThrow(instance.setUSDMultiplier(_newUSDMultiplier, {from: _notAdmin}));
        });

        it("should throw if newUSDMultiplier equals to zero", async () => {
            await util.expectThrow(instance.setUSDMultiplier(0, {from: _admin}));
        });

    });


    describe("changing admin", () => {

        beforeEach(async () => {
            instance = await ExchangeOracle.new(_admin, _initialRate);
        });

        it("should change admin correctly", async () => {
            await instance.setAdmin(_newAdmin);
            const admin = await instance.admin();
            assert.strictEqual(admin, _newAdmin, "The admin was not changed correctly");
        });

        it("should emit event on change admin", async () => {
            const expectedEvent = "AdminChanged";
            let result = await instance.setAdmin(_newAdmin);

            assert.lengthOf(result.logs, 1, "There should be 1 event emitted from setAdmin!");
            assert.strictEqual(result.logs[0].event, expectedEvent,
                `The event emitted was ${result.logs[0].event} instead of ${expectedEvent}`);
        });

        it("should throw if not owner tries to change", async () => {
            await util.expectThrow(instance.setAdmin(_newAdmin, {from: _notOwner}));
        });

        it("should throw if new admin is empty", async () => {
            await util.expectThrow(instance.setAdmin("0x0", {from: _admin}));
        });

        it("should change initial admin and call with the new admin", async () => {
            // call with the initial admin
            await instance.setRate(_newRate, {from: _admin});
            await instance.setRateMultiplier(_newRateMultiplier, {from: _admin});
            await instance.setUSDMultiplier(_newUSDMultiplier, {from: _admin});

            // change initial admin
            await instance.setAdmin(_newAdmin);

            // throw calling with the initial admin
            await util.expectThrow(instance.setRate(_newRate, {from: _admin}));
            await util.expectThrow(instance.setRateMultiplier(_newRateMultiplier, {from: _admin}));
            await util.expectThrow(instance.setUSDMultiplier(_newUSDMultiplier, {from: _admin}));

            // call with the new admin
            await instance.setRate(_newRate, {from: _newAdmin});
            await instance.setRateMultiplier(_newRateMultiplier, {from: _newAdmin});
            await instance.setUSDMultiplier(_newUSDMultiplier, {from: _newAdmin});
        });

    });

});