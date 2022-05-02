import React from 'react'
import card from '../../images/credit.png'
import './Header.css'

const Header = () => {
  return (
    <div className='header'>
        <div className="header-content">
            <h1 className="gradient">
                Exchange <br/>Transactions
            </h1>
            <p> Your next best transaction is a few clicks away. Get historic and live insights on the latest exchange rate details. </p>
            <button type = "button">Get Started</button>
        </div>
        <div className = "header-image">
            <img src={card} alt="card"/>
        </div>
    </div>
  )
}

export default Header