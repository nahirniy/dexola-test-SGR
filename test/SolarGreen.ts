import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("SolarGreen", function () {
  async function deploy() {
    const [owner, buyer, spender, newOwner] = await ethers.getSigners();

    const SolarGreen = await ethers.getContractFactory("SolarGreen", owner);
    const token = await SolarGreen.deploy(owner.address);

    await token.transfer(spender.address, 30);

    return { owner, buyer, spender, newOwner, token };
  }

  it("should have an owner", async function () {
    const { owner, token } = await loadFixture(deploy);

    expect(await token.owner()).to.eq(owner.address);
    expect(await token.getAddress()).to.be.properAddress;
  });

  it("should be correct supply", async function () {
    const { token } = await loadFixture(deploy);

    const decimals = BigInt(10) ** (await token.decimals());

    expect(await token.totalSupply()).to.eq(BigInt(100000000) * decimals);
  });

  it("should transfer ownership to new owner", async function () {
    const { owner, newOwner, token } = await loadFixture(deploy);

    expect(await token.owner()).to.equal(owner.address);

    await token.transferOwnership(newOwner.address);

    expect(await token.owner()).to.equal(newOwner.address);
  });

  it("correct transfer to", async function () {
    const { buyer, token } = await loadFixture(deploy);
    const amount = 3;

    await token.transfer(buyer.address, amount);

    const balanceBuyer = await token.balanceOf(buyer.address);
    expect(balanceBuyer).to.equal(amount);
  });

  it("correct transfer from", async function () {
    const { owner, buyer, spender, token } = await loadFixture(deploy);

    const amount = 8;

    token.approve(spender.address, amount);

    await token.connect(spender).transferFrom(owner.address, buyer.address, amount);

    const balanceBuyer = await token.balanceOf(buyer.address);

    expect(await token.allowance(owner.address, spender.address));
    expect(balanceBuyer).to.eq(amount);
  });

  it("allow to mint new token", async function () {
    const { owner, token } = await loadFixture(deploy);

    const amount = 10;
    const expectedTotalSupply = (await token.totalSupply()) + BigInt(amount);

    await token.mint(owner.address, amount);

    expect(await token.totalSupply()).to.eq(expectedTotalSupply);
  });

  it("allow to burn token", async function () {
    const { owner, token } = await loadFixture(deploy);

    const amount = 8;
    const expectedTotalSupply = (await token.totalSupply()) - BigInt(amount);

    await token.burn(amount);

    expect(await token.totalSupply()).to.eq(expectedTotalSupply);
  });

  // it("allow to burn from", async function () {
  //   const { owner, buyer, spender, token } = await loadFixture(deploy);

  //   const amount = 8;
  //   const expectedTotalSupply = (await token.totalSupply()) - BigInt(amount);

  //   token.approve(spender.address, amount);

  //   await token.burnFrom(spender.address, amount);

  //   expect(await token.allowance(owner.address, spender.address));
  //   expect(await token.totalSupply()).to.equal(expectedTotalSupply);
  // });

  it("should added this address to blacklist", async function () {
    const { buyer, token } = await loadFixture(deploy);

    expect(await token.isBlacklisted(buyer.address)).to.eq(false);

    await token.addToBlacklist(buyer.address);

    expect(await token.isBlacklisted(buyer.address)).to.eq(true);
  });

  it("should remove this address from blacklist", async function () {
    const { buyer, token } = await loadFixture(deploy);

    await token.addToBlacklist(buyer.address);

    expect(await token.isBlacklisted(buyer.address)).to.eq(true);

    await token.removeFromBlacklist(buyer.address);

    expect(await token.isBlacklisted(buyer.address)).to.eq(false);
  });

  it("can't transfer token if address in blacklist", async function () {
    const { buyer, token } = await loadFixture(deploy);
    const amount = 3;

    await token.addToBlacklist(buyer.address);
    await expect(token.transfer(buyer.address, amount)).to.be.revertedWith("recipiant is blacklisted");
  });
});
