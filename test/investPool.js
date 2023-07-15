const { expect, assert } = require("chai");
const { utils } = require("ethers");
const { ethers, upgrades } = require("hardhat");
const { mine } = require("@nomicfoundation/hardhat-network-helpers");

describe("Invest Pool init example", function () {
    let owner, signer, manager, user1, user2, user3, user4, user5, user6, user7, user8, user9, user10, fundrisingWallet;
    let investPool, roleContract, usd, lpToken;

    let price = 110; // 1.1$

    const airDropUSD = async (user, amount) => {
        let _amount = utils.parseEther(amount.toString())
        await usd.mint(user.address, _amount)
        expect(await usd.balanceOf(user.address)).to.equal(_amount)
    }

    const givaAllAprroves = async (user, amount) => {
        await usd.connect(user).approve(investPool.address, amount)
        expect(await usd.allowance(user.address, investPool.address)).to.equal(amount)
    }

    const makeBuy = async (user, amount) => {
        let balUsdUserBefore = await usd.balanceOf(user.address)
        let balLPUserBefore = await lpToken.balanceOf(user.address)
        let balFSWUsdBefore = await usd.balanceOf(fundrisingWallet.address)
        let balPoolLPBefore = await lpToken.balanceOf(investPool.address)
        let Purchase = await investPool.connect(user).buy(utils.parseEther(String(amount)))
        let balUsdUserAfter = await usd.balanceOf(user.address)
        let balLPUserAfter = await lpToken.balanceOf(user.address)
        let balFSWUsdAfter = await usd.balanceOf(fundrisingWallet.address)
        let balPoolLPAfter = await lpToken.balanceOf(investPool.address)
        let roleInfo = await investPool.roleSettings((await roleContract.getRole(user.address)).roleNumber)
        let roleFee = Number(roleInfo.roleFee) == 0 ? 5 : Number(roleInfo.roleFee)
        let _price = await investPool.price()
        let amountLP = amount * (1000 - roleFee) / 1000 / _price * 100
        assert.equal(utils.formatEther(balUsdUserAfter), utils.formatEther(balUsdUserBefore) - amount)
        assert.equal(utils.formatEther(balLPUserAfter), Number(utils.formatEther(balLPUserBefore)) + amountLP)
        assert.equal(utils.formatEther(balFSWUsdAfter), Number(utils.formatEther(balFSWUsdBefore)) + amount)
        assert.equal(utils.formatEther(balPoolLPAfter), Number(utils.formatEther(balPoolLPBefore)) - amountLP)
        let tx = await Purchase.wait()
        assert.equal(tx.events[3].event, "Purchase")
        assert.equal(tx.events[3].args.user, user.address)
        assert.equal(utils.formatEther(tx.events[3].args.amount), amountLP)
    }

    before(async () => {
        [owner, signer, manager, user1, user2, user3, user4, user5, user6, user7, user8, user9, user10] = await ethers.getSigners();
        let users = [user1, user2, user3, user4, user5, user6, user7, user8, user9, user10]
        fundrisingWallet = await ethers.Wallet.createRandom()

        const USD = await ethers.getContractFactory("contracts/LPtoken.sol:LPtoken");
        usd = await USD.deploy("usd", "usd", manager.address);
        await usd.deployed();

        const LPToken = await ethers.getContractFactory("contracts/LPtoken.sol:LPtoken");
        lpToken = await LPToken.deploy("testing", "tst", manager.address);

        const Roles = await ethers.getContractFactory("RoleContract");
        roleContract = await upgrades.deployProxy(Roles, [signer.address, manager.address, [
            {
                roleNumber: 0,
                isExist: true,
                maxAmount: utils.parseEther("100"),
                minAmount: 0,
            },
            {
                roleNumber: 1,
                isExist: true,
                maxAmount: utils.parseEther("500"),
                minAmount: 0,
            },
            {
                roleNumber: 2,
                isExist: true,
                maxAmount: utils.parseEther("1000"),
                minAmount: utils.parseEther("500"),
            }
        ]]);

        const InvestPool = await ethers.getContractFactory("contracts/InvestPool.sol:InvestPool");
        investPool = await InvestPool.deploy(lpToken.address, roleContract.address, usd.address, fundrisingWallet.address, 5, price, utils.parseEther("1200"), manager.address,
            [
                {
                    roleNumber: 0,
                    startTime: Math.floor(Date.now() / 1000) + 1000,
                    deadline: Math.floor(Date.now() / 1000) + 3000,
                    roleFee: 20,
                    maxAmountToSellForRole: utils.parseEther("100")
                },
                {
                    roleNumber: 1,
                    startTime: Math.floor(Date.now() / 1000) + 50,
                    deadline: Math.floor(Date.now() / 1000) + 1000,
                    roleFee: 10,
                    maxAmountToSellForRole: utils.parseEther("600")
                },
                {
                    roleNumber: 2,
                    startTime: Math.floor(Date.now() / 1000) + 50,
                    deadline: Math.floor(Date.now() / 1000) + 3000,
                    roleFee: 0,
                    maxAmountToSellForRole: utils.parseEther("1500")
                },
            ]
        );
        await investPool.deployed();

        {
            await lpToken.mint(investPool.address, utils.parseEther("2700"))
        }

        for (let i = 0; i < users.length; i++) {
            await airDropUSD(users[i], 1000000)
            await givaAllAprroves(users[i], utils.parseEther("100000000000000000000"))
        }

    });

    describe("give roles", () => {
        it("role 1 to user1", async () => {
            await roleContract.connect(manager).giveRole(user1.address, 1, 10)
            assert.deepEqual(await roleContract.getRole(user1.address), await roleContract.rolesList(1))
            assert.equal(await roleContract.getDeadline(user1.address), (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp + (10 * 24 * 60 * 60))
        })
        it("role 2 to user2", async () => {
            await roleContract.connect(manager).giveRole(user2.address, 2, 20)
            assert.deepEqual(await roleContract.getRole(user2.address), await roleContract.rolesList(2))
            assert.equal(await roleContract.getDeadline(user2.address), (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp + (20 * 24 * 60 * 60))
        })
        it("role 2 to user4", async () => {
            await roleContract.connect(manager).giveRole(user4.address, 2, 10)
            assert.deepEqual(await roleContract.getRole(user4.address), await roleContract.rolesList(2))
            assert.equal(await roleContract.getDeadline(user4.address), (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp + (10 * 24 * 60 * 60))
        })
    })

    describe("buy tokens", () => {
        it("buy error 'Wrong amount'", async () => {
            await expect(investPool.connect(user1).buy(utils.parseEther("1000"))).to.be.rejectedWith("IA")
            await expect(investPool.connect(user2).buy(utils.parseEther("500"))).to.be.rejectedWith("IA")
            await expect(investPool.connect(user2).buy(utils.parseEther("5000"))).to.be.rejectedWith("IA")
            await expect(investPool.connect(user3).buy(utils.parseEther("1000"))).to.be.rejectedWith("IA")
        })
        it("buy error 'Sale hasn't started'", async () => {
            await expect(investPool.connect(user1).buy(utils.parseEther("505"))).to.be.rejectedWith("TE")
            await expect(investPool.connect(user2).buy(utils.parseEther("505"))).to.be.rejectedWith("TE")
            await expect(investPool.connect(user3).buy(utils.parseEther("100"))).to.be.rejectedWith("TE")
        })
        it("buy user1", async () => {
            await mine(50)
            await makeBuy(user1, 400)
        })
        it("buy user2", async () => {
            await makeBuy(user2, 600)
        })
        it("buy error 'Amount to sell limit'", async () => {
            await expect(investPool.connect(user4).buy(utils.parseEther("600"))).to.be.rejectedWith("LT")
        })
        it("set price", async () => {
            await investPool.setPrice(11)
            assert.equal(await investPool.price(), 11)
        })
        it("buy error 'Role limit'", async () => {
            await expect(investPool.connect(user1).buy(utils.parseEther("100"))).to.be.rejectedWith("RR")
        })
        it("buy user3", async () => {
            await mine(1000)
            await makeBuy(user3, 10)
        })
    })
})