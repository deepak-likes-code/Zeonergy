/* pages/my-assets.js */
import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Web3Modal from "web3modal"

import {
    nftmarketaddress, nftaddress
} from '../config'

import Market from '../artifacts/contracts/Market.sol/NFTMarket.json'
import NFT from '../artifacts/contracts/NFT.sol/MyToken.json'

export default function MyAssets() {
    const [nfts, setNfts] = useState([])
    const [loadingState, setLoadingState] = useState('not-loaded')


    useEffect(() => {
        loadNFTs()
    }, [])


    async function loadNFTs() {
        const web3Modal = new Web3Modal({
        })
        const connection = await web3Modal.connect()
        const provider = new ethers.providers.Web3Provider(connection)
        const signer = await provider.getSigner()
        const signerAddress = await signer.getAddress()
        const NFTContract = new ethers.Contract(nftaddress, NFT.abi, signer)
        console.log(NFTContract)
        console.log(signerAddress)
        // const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider)
        const data1 = await NFTContract.fetchBoughtNFTs();
        console.log('fetched data: ', data1)
        // const data2 = await NFTContract.creatorTokens(signerAddress, 1);

        // const cost = ethers.utils.formatUnits(data.cost.toString(), 'ether')
        // console.log(data)
        // console.log(data2)

        // console.log('Total Supply :', data.totalSupply.toNumber())

        // const items = [];


        let items = await Promise.all(data1.map(async i => {
            // const meta = await axios.get(tokenUri)
            let price = await ethers.utils.formatUnits(i.cost.toString(), 'ether')
            let item = {
                name: await i[2],
                price,
                tokenId: await i[0].toNumber(),
                seller: await i[1],
                owner: "me",
                image: i.mediaUrl
            }
            return item
        })
        )


        console.log('items:', items)




        // console.log(items)
        setLoadingState('loaded')
        setNfts(items)

    }


    // if (loadingState === 'loaded' && nfts.length===0) return (<h1 className="py-10 px-20 text-3xl">No assets owned</h1>)
    return (



        <div className="flex justify-center">

            <div className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                    {
                        nfts.map((nft, i) => (
                            <div key={i} className="border shadow rounded-xl overflow-hidden">
                                <img src={nft.image} className="rounded p2" />
                                <div className="p-4 bg-black">
                                    {/* <a className="text-2xl font-bold text-white" rel="opener" href={nft.image} >link</a> */}
                                    <p className="text-2xl font-bold text-white">Price - {nft.price} Eth</p>
                                    <p className="text-2xl font-bold text-white">Name - {nft.name} </p>
                                </div>
                            </div>
                        ))
                    }
                </div>
            </div>




        </div>
    )
}