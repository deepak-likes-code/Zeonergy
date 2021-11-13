const { ethers } = require("hardhat");

async function main() {
    const NFTMarket = await ethers.getContractFactory("NFTMarket");
    const NFT = await ethers.getContractFactory("NFT")
    // Start deployment, returning a promise that resolves to a contract object
    const nftMarket = await NFTMarket.deploy();

    console.log("NFTMarket Contract deployed to address:", nftMarket.address);

    const nft = await NFT.deploy(nftMarket.address);
    console.log("NFT Contract deployed to address:", nft.address);
}
main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });