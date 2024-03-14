const { expect } = require("chai");
// const hre = require("hardhat");

describe("Deployment", function () {

    let ev, owner;

    before(async () => {
        [owner, ...shop] = await ethers.getSigners();
        [...transporter] = await ethers.getSigners();
        ev = await ethers.deployContract("ECOVERIFY",[owner.address]);
    });



    describe("Basic Deployment", function () {
        it(`Contract is deployed, i.e. address is not null`, async function () {
            expect(ev.address).not.equal(0);
        });

        it('Checking Ownership of the contract', async function () {
            expect(await ev.owner()).equal(owner.address)
        });
    });

    describe("Shop Access stage", async function () {

        // Checking Access Control
        it('Shop tries to give access but fails as not allowed', async function () { 
            await expect(ev.connect(shop[0]).grantAccess(shop[0].address)).reverted;
        });

        it('Only Manufacturer can grant access to shops', async function () { 
            await expect(ev.connect(owner).grantAccess(shop[0].address));
        });

        it('Cannot regrant access', async function () { 
            await expect(ev.connect(owner).grantAccess(shop[0].address)).revertedWith('Already has access');
        });

        it('Only Admin can revoke access to shops', async function () { 
            await expect(ev.connect(shop[0]).revokeAccess(shop[0].address)).reverted;
            await expect(ev.connect(owner).revokeAccess(shop[0].address));
        });

        it('Cannot revoke access on non-grantted shops', async function () { 
            await expect(ev.connect(owner).revokeAccess(shop[0].address)).revertedWith('Already has no access');
        });

        // Granting Access to actor[0].address
        it('Granting Access to shop[0] shop[1]', async function () { 
            await ev.connect(owner).grantAccess(shop[0].address);
            await ev.connect(owner).grantAccess(shop[1].address);
        });
    });

    describe("Oil Production", async function () {
        it('random entity tries make oils (both types) but fails (300ml, 200$)', async function () { 
            await expect(ev.connect(shop[0]).produceOilLocal(300,200)).reverted;
            await expect(ev.connect(shop[0]).produceOilExport(300,200)).reverted;
        });

        it(`Making 2 products Checking the product information as per our expectation
        1. Product_1
        id: 1; manufacturer:'owner'; destination: ''; volume: 300; price: 200; onlyForExport: False; sold: False;
        2. Product_2
        id: 2; manufacturer:'owner'; destination: ''; volume: 300; price: 200; onlyForExport: True; sold: False;        
        `, async function () { 

            await ev.connect(owner).produceOilLocal(300,200)
            await ev.connect(owner).produceOilExport(300,200)

            let temp_1 = await ev.oilInformation(1)
            expect(temp_1['id']).to.equal(1)
            expect(temp_1['manufacturer']).to.equal(owner.address)
            expect(temp_1['destination']).to.equal('')
            expect(temp_1['volume']).to.equal(300)
            expect(temp_1['price']).to.equal(200)
            expect(temp_1['onlyForExport']).to.equal(false)
            expect(temp_1['sold']).to.equal(false)
            
            let temp_2 = await ev.oilInformation(2)
            expect(temp_2['id']).to.equal(2)
            expect(temp_2['manufacturer']).to.equal(owner.address)
            expect(temp_2['destination']).to.equal('')
            expect(temp_2['volume']).to.equal(300)
            expect(temp_2['price']).to.equal(200)
            expect(temp_2['onlyForExport']).to.equal(true)
            expect(temp_2['sold']).to.equal(false)   
        });

        it(`Making 4 more products Checking the product information as per our expectation`, async function () { 
            // Local oils
            await ev.connect(owner).produceOilLocal(500,300)
            await ev.connect(owner).produceOilLocal(1000,400)

            // Export oils
            await ev.connect(owner).produceOilExport(500,350)
            await ev.connect(owner).produceOilExport(1000,500)
        });
    })

    describe("Looking at the local market i.e. Shop[1]", async function () {
        it('Cannot sell non-exisiting product', async function () { 
            await expect(ev.connect(shop[0]).sellOil(0,'')).to.rejectedWith('Product does not exist')
            await expect(ev.connect(shop[0]).sellOil(1000,'')).to.rejectedWith('Product does not exist')
        });

        it('Non-authorized shop cannot sell oils', async function () { 
            await expect(ev.connect(shop[5]).sellOil(1,'')).to.rejectedWith('Not authorized')
        });

        it('Selling Oil 1, and checking sold is true', async function () { 
            const product_id = 1
            await ev.connect(shop[1]).sellOil(product_id,'')
            const temp = await ev.oilInformation(product_id)
            expect(temp['sold']).to.equal(true)
        });

        it('Item cannot be resold', async function () {
            await expect(ev.connect(shop[1]).sellOil(1,'')).to.rejectedWith('Product already sold')
        })

        it('Cannot Sell Oil 2 without destination, which is supposed to be exported', async function () { 
            await expect(ev.connect(shop[1]).sellOil(2,'')).to.rejectedWith('Destination field empty');
        });

        it('Selling product 2 with desination "Japan" and checking infomation', async function () { 
            const product_id = 2
            await ev.connect(shop[1]).sellOil(product_id,'Japan')
            const temp = await ev.oilInformation(product_id)
            expect(temp['sold']).to.equal(true)
            expect(temp['destination']).to.equal('Japan')
        });

    })
});

