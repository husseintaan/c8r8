import React from 'react';
import logo from '../../images/logo.png';
import './Navbar.css'

const Navbar = () => {
  return (
    <div className='navbar'>
        <div className = 'navbar-links'>
          <div className = 'logo'>
            <img src = {logo} alt = 'logo'/>
          </div>
        
          <div className = 'navbar-links-container'>
            <p><a href = "#rates">Rates</a></p>
            <p><a href = "#calculator">Calculator</a></p>
            <p><a href = "#timeline">Timeline</a></p>
          </div>
        </div>
        <div className = 'navbar-sign'>
            <p> Register</p>
            <p> <b> Sign up </b> </p>
        </div>
    </div>
  ) 
}

export default Navbar;