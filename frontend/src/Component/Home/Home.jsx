import React from 'react'
import Loreams from './Loreams'
import HowItWorks from './Steps'
import Disclaimer from './Disclaimer'
import Card from './Card'


const Home = () => {
  return (
    <>
      <div className="bg-[#f4f4fb] dark:bg-[#1a1a2a]">
        <Card />
        <HowItWorks />
        <Loreams />
        <Disclaimer />
      </div>
    </>
  )
}

export default Home