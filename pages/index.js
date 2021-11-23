/* pages/index.js */
import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Web3Modal from "web3modal"

import {
  nftaddress, chainlinkPriceFeed
} from '../config'

import NFT from '../artifacts/contracts/NFT.sol/MyToken.json'
import Market from '../artifacts/contracts/Market.sol/NFTMarket.json'
import { priceFeedAbi } from './aggregatorV3InterfaceABI'

export default function Home() {

  const [nfts, setNfts] = useState([])
  const [loadingState, setLoadingState] = useState('not-loaded')
  const [userAddress, setUserAddress] = useState("Not Connected")
  const [inUSD, setInUSD] = useState(null)



  useEffect(() => {
    loadNFTs()
  }, [])




  function priceAccurate(price) {
    return (price / Math.pow(10, 8)).toFixed(4)
  }

  async function loadNFTs() {
    /* create a generic provider and query for unsold market items */
    const web3Modal = new Web3Modal()
    if (!web3Modal.providerController.injectedProvider) {
      alert("Get metamask to view the website")
    }



    const connection = await web3Modal.connect()
    console.log(connection)

    const provider = new ethers.providers.Web3Provider(connection)

    const priceContract = new ethers.Contract(chainlinkPriceFeed, priceFeedAbi, provider)
    console.log(priceContract)
    const price = await priceContract.getLatestPrice();
    const priceDecimal = (price.toNumber())
    const accuratePrice = priceAccurate(priceDecimal)
    console.log('price in usd is ', accuratePrice)
    setInUSD(accuratePrice)

    const signer = provider.getSigner();
    const accountAddress = await signer.getAddress();
    setUserAddress(accountAddress)
    const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider)
    // const marketContract = new ethers.Contract(nftmarketaddress, Market.abi, provider)
    const data = await tokenContract.fetchAvailableNFTs()
    console.log(data)

    /*
    *  map over items returned from smart contract and format 
    *  them as well as fetch their token metadata
    */
    const items = await Promise.all(data.map(async i => {
      // const tokenUri = await tokenContract.tokenURI(i.tokenId)
      // const meta = await axios.get(tokenUri)
      let price = ethers.utils.formatUnits(i.cost.toString(), 'ether')
      let item = {
        price,
        tokenId: i[0].toNumber(),
        seller: i[0][1],
        owner: i[0][1],
        image: i.mediaUrl,
        name: i[2],
        amount: i.amountAvailable.toNumber(),
      }
      return item
    }))
    setNfts(items)
    setLoadingState('loaded')
  }
  function updateAmountToBuy(e, tokenId) {
    console.log(e.target.value, tokenId)
  }

  async function buyNft(nft, i) {
    /* needs the user to sign the transaction, so will use Web3Provider and sign it */
    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()
    const contract = new ethers.Contract(nftaddress, NFT.abi, signer)

    /* user will be prompted to pay the asking proces to complete the transaction */

    const amount = document.getElementById(i).value;
    if (!amount) {
      alert("Enter Valid Amount To Buy")
      return
    }
    console.log(amount)

    // const price = ethers.utils.parseUnits(nft.cost.toString(), 'ether') * amount;
    const priceToPay = nft.price * amount;
    // priceToPay = ethers.utils.parseUnits(priceToPay.toString(), 'ether')
    const bigNumPrice = ethers.utils.parseUnits(priceToPay.toString(), 'ether')
    const transaction = await contract.buyTokens(nft.tokenId, amount, { value: bigNumPrice })
    // const transaction = await contract.createMarketSale(nftaddress, nft.tokenId, { value: price })
    await transaction.wait()
    loadNFTs()
  }
  if (loadingState === 'loaded' && !nfts.length) return (<h1 className="px-20 py-10 text-3xl">No items in marketplace</h1>)
  return (
    <div className="flex justify-center">
      <div className="px-4" style={{ maxWidth: '1600px' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">

          {
            nfts.map((nft, i) => (
              <div key={i} style={{ border: "grey 1px solid", display: "flex", flexDirection: "column", overflow: "hidden", borderRadius: "20px" }} className="nftItem">
                <div style={{ height: "100%" }}>
                  <img className="rounded" src={nft.image} />
                </div>
                <div className="text-center px-2 py-3">
                  <p style={{}} className="text-2xl p-3 font-semibold">{nft.name}</p>
                  <p className="text-gray-400">{nft.amount}</p>
                </div>
                <div className="p-4 bg-black " >
                  <p className="text-2xl mb-4 font-bold text-white">{nft.price} MATIC</p>
                  <p className="text-2xl mb-4 font-bold text-white">{(nft.price * inUSD).toFixed(5)} USD</p>
                  <input id={i} type="number" min="0" max={nft.amount} placeholder="quantity" className="text-2xl mb-4  text-black rounded  p-3 shadow-lg" onChange={e => updateAmountToBuy(e, nft.tokenId)} />


                  <button className="w-full bg-blue-500 text-white font-bold py-2 px-12 rounded" onClick={() => buyNft(nft, i)}>Buy</button>
                </div>
              </div>
            ))
          }


        </div>
      </div>
    </div >
  )
}