/* pages/create-item.js */
import { useState } from 'react'
import { ethers } from 'ethers'
import { create as ipfsHttpClient } from 'ipfs-http-client'
import { useRouter } from 'next/router'
import Web3Modal from 'web3modal'
import { RingLoader } from 'react-spinners'
import { Alert } from '@material-ui/lab'

const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0')

import {
    nftaddress, nftmarketaddress
} from '../config'

import NFT from '../artifacts/contracts/NFT.sol/NFT.json'
import Market from '../artifacts/contracts/Market.sol/NFTMarket.json'

export default function CreateItem() {
    const [fileUrl, setFileUrl] = useState(null)
    const [loading, setLoading] = useState('not-loading')
    const [formInput, updateFormInput] = useState({ price: '', name: '', description: '' })
    const router = useRouter()

    async function onChange(e) {
        const file = e.target.files[0]
        const fileType = e.target.files[0].type
        if (fileType !== "application/pdf") {
            alert("Only PDF files are accepted")
        }
        else if (fileType === "application/pdf") {


            try {
                const added = await client.add(
                    file,
                    {
                        progress: (prog) => console.log(`received: ${prog}`)
                    }
                )
                const url = `https://ipfs.infura.io/ipfs/${added.path}`
                setFileUrl(url)
            } catch (error) {
                console.log('Error uploading file: ', error)
            }
        }
    }
    async function createMarket() {
        const { name, description, price } = formInput
        if (!name || !description || !price || !fileUrl) {

            alert("Enter all fields!")

            return
        }
        /* first, upload to IPFS */
        const data = JSON.stringify({
            name, description, image: fileUrl
        })
        try {
            const added = await client.add(data)
            const url = `https://ipfs.infura.io/ipfs/${added.path}`
            /* after file is uploaded to IPFS, pass the URL to save it on Polygon */
            createSale(url)
        } catch (error) {
            console.log('Error uploading file: ', error)
        }
    }

    async function createSale(url) {
        const web3Modal = new Web3Modal()
        const connection = await web3Modal.connect()
        const provider = new ethers.providers.Web3Provider(connection)
        const signer = provider.getSigner()

        /* next, create the item */
        let contract = new ethers.Contract(nftaddress, NFT.abi, signer)
        let transaction = await contract.createToken(url)
        setLoading('minting')
        let tx = await transaction.wait()
        let event = tx.events[0]
        let value = event.args[2]
        let tokenId = value.toNumber()
        const price = ethers.utils.parseUnits(formInput.price, 'ether')
        setLoading('not-loading')
        /* then list the item for sale on the marketplace */
        connection = await web3Modal.connect()
        provider = new ethers.providers.Web3Provider(connection)
        signer = provider.getSigner()
        contract = new ethers.Contract(nftmarketaddress, Market.abi, signer)
        // let listingPrice = await contract.getListingPrice()
        // listingPrice = listingPrice.toString()
        transaction = await contract.createMarketItem(nftaddress, tokenId, price)
        setLoading('creatingMarketSale')
        await transaction.wait()
        setLoading('not-loading')
        router.push('/')
    }

    return (



        <div className="flex justify-center">

            {loading === 'not-loading' && (

                <div className="w-1/2 flex flex-col pb-12">
                    <input
                        placeholder="Asset Name"
                        className="mt-8 border rounded p-4"
                        onChange={e => updateFormInput({ ...formInput, name: e.target.value })}
                    />
                    <textarea
                        placeholder="Asset Description"
                        className="mt-2 border rounded p-4"
                        onChange={e => updateFormInput({ ...formInput, description: e.target.value })}
                    />
                    <input
                        placeholder="Asset Price in Eth"
                        className="mt-2 border rounded p-4"
                        onChange={e => updateFormInput({ ...formInput, price: e.target.value })}
                    />
                    <input
                        type="file"
                        name="Asset"
                        className="my-4"
                        onChange={onChange}
                    />
                    {
                        fileUrl && (
                            <embed className="rounded mt-4" height="250" width="350" src={fileUrl} />
                        )
                    }
                    <button onClick={createMarket} className="font-bold mt-4 bg-blue-500 text-white rounded p-4 shadow-lg">
                        Create Digital Asset
                    </button>
                </div>

            )}

            {loading === 'minting' && (
                (
                    <div className="loader"
                        style={{
                            textAlign: 'center',
                            display: 'flex',
                            justifyContent: 'center',
                            flexDirection: 'column',
                            alignItems: 'center'
                        }}
                    >
                        <p style={{ fontWeight: '700' }} > Miners At Work ⚒️  </p>
                        <RingLoader
                            color="#ededed"
                            css={{
                                display: "block",
                                margin: "1rem auto",
                            }}
                        />
                    </div>
                )
            )}

            {loading === 'creatingMarketSale' && (
                (
                    <div className="loader"
                        style={{
                            textAlign: 'center',
                            display: 'flex',
                            justifyContent: 'center',
                            flexDirection: 'column',
                            alignItems: 'center'
                        }}
                    >
                        <p style={{ fontWeight: '700' }}> Creating Market Sale 🛍️ </p>
                        <RingLoader
                            color="#ededed"
                            css={{
                                display: "block",
                                margin: "1rem auto",
                            }}
                        />
                    </div>
                )
            )}

        </div>
    )
}
