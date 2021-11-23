/* pages/_app.js */
import '../styles/globals.css'
import Home from './index'
import Link from 'next/link'



function MyApp({ Component, pageProps }) {
  return (



    <div>
      <nav className="border-b p-6 flex justify-between ">
        <Link href="/">
          <a>

            <p className="text-4xl text-blue-500 font-bold">Creator Nation</p>
          </a>
        </Link>

        <div className="flex mt-4">
          <Link href="/">
            <a className="mr-4 text-blue-500">
              Home
            </a>
          </Link>
          <Link href="/create-item">
            <a className="mr-6 text-blue-500">
              Sell Digital Asset
            </a>
          </Link>
          <Link href="/my-assets">
            <a className="mr-6 text-blue-500">
              My Digital Assets
            </a>
          </Link>
          <Link href="/register-creator">
            <a className="mr-6 text-blue-500">
              Register Creator
            </a>
          </Link>
          <Link href="/creator-dashboard">
            <a className="mr-6 text-blue-500">
              Creator Dashboard
            </a>
          </Link>
        </div>
      </nav>
      <Component {...pageProps} />
    </div>

  )
}

export default MyApp