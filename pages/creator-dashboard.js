/* pages/creator-dashboard.js */
import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Web3Modal from "web3modal"

import {
    nftmarketaddress, nftaddress
} from '../config'

import Market from '../artifacts/contracts/Market.sol/NFTMarket.json'
import NFT from '../artifacts/contracts/NFT.sol/MyToken.json'

export default function CreatorDashboard() {
    const [nfts, setNfts] = useState([])
    const [sold, setSold] = useState([])
    const [loadingState, setLoadingState] = useState('not-loaded')
    useEffect(() => {
        loadNFTs()
    }, [])
    async function loadNFTs() {
        const web3Modal = new Web3Modal({
        })
        const connection = await web3Modal.connect()
        const provider = new ethers.providers.Web3Provider(connection)
        const signer = provider.getSigner()

        // const marketContract = new ethers.Contract(nftmarketaddress, Market.abi, signer)
        const tokenContract = new ethers.Contract(nftaddress, NFT.abi, signer)
        console.log(tokenContract)
        const data = await tokenContract.fetchCreatedNFTs()
        // console.log(data[0].amountAvailable.toNumber(), data[0].totalSupply.toNumber())


        const items = await Promise.all(data.map(async i => {

            let price = await ethers.utils.formatUnits(i.cost.toString(), 'ether')

            let item = {
                name: await i[2],
                price,
                tokenId: await i[0].toNumber(),
                seller: await i[1],
                owner: "me",
                image: i.mediaUrl,
                amountAvailable: i.amountAvailable.toNumber(),
                totalSupply: i.totalSupply.toNumber()
            }

            return item
        }))

        console.log('Items Created ', items)


        /* create a filtered array of items that have been sold */
        const soldItems = items.filter(i => i.sold)
        setSold(items)
        setNfts(items)
        setLoadingState('loaded')
    }


    // if (loadingState === 'loaded' && !nfts.length) return (<h1 className="py-10 px-20 text-3xl">No assets created</h1>)
    return (
        // <div>
        //     <div className="p-4">
        //         <h2 className="text-2xl py-2">Items Created</h2>
        //         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
        //             {
        //                 nfts.map((nft, i) => (
        //                     <div key={i} className="border shadow rounded-xl overflow-hidden">
        //                         <img src={nft.image} className="rounded" />
        //                         <div className="p-4 bg-black">
        //                             <a className="text-2xl underline text-white" href={nft.image} >link</a>
        //                             <p className="text-2xl font-bold text-white">Price - {nft.price} Eth</p>
        //                             <p className="text-2xl font-bold text-white">sold - {nft.totalSupply - nft.amountAvailable} Eth</p>
        //                         </div>
        //                     </div>
        //                 ))
        //             }
        //         </div>
        //     </div>
        <div className="px-4">

            {!sold.length && (
                <div>
                    <h2 className="text-2xl py-2">None Created</h2>
                </div>
            )}

            {sold.length > 0 && (



                <div>
                    <h2 className="text-2xl py-2">Items sold</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                        {
                            sold.map((nft, i) => (
                                <div key={i} className="border shadow rounded-xl overflow-hidden">
                                    <img src={nft.image} className="rounded" />
                                    <div className="p-4 bg-black">
                                        <p className="text-2xl font-bold text-white">Price - {nft.price} Eth</p>
                                        <p className="text-2xl font-bold text-white">Available - {nft.amountAvailable} </p>
                                        <p className="text-2xl font-bold text-white">Sold - {nft.totalSupply - nft.amountAvailable} </p>
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                </div>
            )}

        </div>
        // </div >
    )
}
