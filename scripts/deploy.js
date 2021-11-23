const { ethers } = require("hardhat");


async function main() {
    const MyToken = await ethers.getContractFactory("CreatorNation")
    const priceFeed = await ethers.getContractFactory("PriceFeed")

    const nft = await MyToken.deploy("creatorNation", 2);
    const price = await priceFeed.deploy();
    console.log("NFT Contract deployed to address:", nft.address);
    console.log("Price Feed Contract deployed at: ", price.address)

}
main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });