import './App.css';
import logo from './images/logo.png';

import { useState, useEffect, useCallback } from "react";
import { Alert, AppBar, Box, Button, Snackbar, Toolbar, Typography } from '@mui/material';
import  { getUserToken, saveUserToken, clearUserToken } from "./localStorage";
import { DataGrid } from '@mui/x-data-grid';
import Chart from 'react-google-charts'



import Navbar from './components/Navbar/Navbar';
import Header from './components/Header/Header'
import FormPost from './components/FormPost/FormPost';
import UserCredentialsDialog from './components/UserCredentialsDialog/UserCredentialsDialog';


const States = {
  PENDING: "PENDING",
  USER_CREATION: "USER_CREATION",
  USER_LOG_IN: "USER_LOG_IN",
  USER_AUTHENTICATED: "USER_AUTHENTICATED",
  USER_NOT_AUTHENTICATED: "USER_NOT_AUTHENTICATED"
 };

 
 var SERVER_URL = "http://127.0.0.1:5000";

 function movingAverage(array){
    if(array.length==1){
      return [[0].concat(array)];
    }
    else if(array.length >1){
      const temp = [[0].concat([array[0]])];
      for(var i = 1; i<array.length;i++){
        temp.push([i,(temp[i-1][1]*i+array[i])/(i+1)])
      }
      return temp;
    }
    else{return [[]]}
 }
 console.log("fix", movingAverage([1,2,3]))

function App() {
  let [buyUsdRate, setBuyUsdRate] = useState(null);
  let [sellUsdRate, setSellUsdRate] = useState(null);
  let [lbpInput, setLbpInput] = useState("");
  let [usdInput, setUsdInput] = useState("");
  let [transactionType, setTransactionType] = useState("usd-to-lbp");

  let [userToken, setUserToken] =useState(getUserToken());
  let [authState, setAuthState] = useState(States.PENDING);

  let [amount, setAmount] = useState(1);
  let [amount2, setAmount2] = useState(1);
  let [fromLBP, setFromLBP] = useState(true);
  let [fromLBP2, setFromLBP2] =useState(false);
  let [userTransactions, setUserTransactions] = useState([]);

  let [postOpen, setPostOpen]= useState(false);
  let [tlPosts, setTlPosts] = useState([]);
  let [allUsdTransactions, setAllUsdTransactions]= useState([]);
  let [allLbpTransactions, setAllLbpTransactions]= useState([]);
  let lAmount1, uAmount1;
  let lAmount2, uAmount2;
  
  if(fromLBP){
    lAmount1 = amount;
    uAmount1 = amount/buyUsdRate;
  } else{
    uAmount1 = amount;
    lAmount1 = amount*buyUsdRate;
  }

  if(fromLBP2){
    lAmount2 = amount2;
    uAmount2 = amount2/sellUsdRate;
  } else{
    uAmount2 = amount2;
    lAmount2 = amount2*sellUsdRate;
  }

  function fetchRates() { // retrieve exchange rates and update the UI
    fetch(`${SERVER_URL}/exchangeRate`)
    .then(response => response.json())
    .then(data =>{
      setSellUsdRate(data['usd_to_lbp']);
      setBuyUsdRate(data['lbp_to_usd']);
    });
  }
  useEffect(fetchRates, []);

  
  function plotAll(){
    fetch(`${SERVER_URL}/plotall`)
    .then(response=>response.json())
    .then(transactions=>{
      setAllUsdTransactions(movingAverage(transactions['usd_to_lbp_rates'])); 
      setAllLbpTransactions(movingAverage(transactions['lbp_to_usd_rates'])); 
  })
  

  }
  useEffect(plotAll, []);


  function addItem() {
    if(usdInput == ""||lbpInput==""){alert('Empty field!'); return;}
    if(usdInput==0||lbpInput==0){alert('Null transaction not allowed.'); return;}
    if(usdInput<0||lbpInput<0){alert('Negative values in transaction not allowed.'); return;}
    const auth = userToken? 'Bearer ' + userToken: '';
    fetch(`${SERVER_URL}/transaction`,{
        method: 'POST',
        headers: {
            'Content-Type':'application/json',
            'Authorization': auth
        },
        body: JSON.stringify({
            usd_to_lbp: transactionType == 'usd-to-lbp'?true:false,
            lbp_amount: lbpInput,
            usd_amount: usdInput
        })
    })
    .then(response => response.json())
    .then(()=>{fetchRates(); plotAll();
      setUsdInput(""); 
      setLbpInput(""); 
      if(userToken){
        fetchUserTransactions();
      }
      console.log(auth)});
  }

  function buyFunction(){
    if(buyUsdRate == null||buyUsdRate===0) {return "Not available yet"}
    return `1 USD at ${buyUsdRate} LBP`
  }

  function sellFunction(){
    if(sellUsdRate == null||sellUsdRate===0) {return "Not available yet"}
    return `1 USD at ${sellUsdRate} LBP`
  }

  function login(username, password){
    return fetch(`${SERVER_URL}/authentication`,{
      method: "POST",
      headers: {
        "Content-Type":'application/json'
      },
      body: JSON.stringify({
        user_name: username,
        password: password,
      }),
    })
    .then((response) => {
      if(response.ok){
        response.json()
        .then((body)=>{
          setAuthState(States.USER_AUTHENTICATED);
          setUserToken(body.token);
          saveUserToken(body.token);
        })
      }
      else{
        setAuthState(States.USER_NOT_AUTHENTICATED);
      }
    })
  }
  function logout() {
    setUserToken(null);
    clearUserToken();
  }
  
  function createUser(username, password){
    return fetch(`${SERVER_URL}/user`,{
      method: "POST",
      headers: {
        "Content-Type":"application/json",
      },
      body: JSON.stringify({
        user_name: username,
        password: password,
      }),
    }).then((response)=>{
      if(response.ok){
        response.json()
        .then((body)=>{
          setAuthState(States.USER_AUTHENTICATED);
          setUserToken(body.token);
          saveUserToken(body.token);
        })
      }
      else{
        setAuthState(States.USER_NOT_AUTHENTICATED);
      }
    })
  }

  const fetchUserTransactions = useCallback(()=>{
    fetch(`${SERVER_URL}/transaction`,{
      headers:{
        Authorization: `bearer ${userToken}`,
      },
    }) 
      .then((response)=> response.json())
      .then((transactions)=>{setUserTransactions(transactions);console.log(transactions);});
  },[userToken]);

  useEffect(()=>{
    if(userToken){
      fetchUserTransactions();
    }
  }, [fetchUserTransactions, userToken]);

  function postTimeline(usd,lbp, u2l){
    if(usd == ""||lbp==""){alert('Empty field!'); return;}
    if(usd==0||lbp==0){alert('Null transaction not allowed.'); return;}
    if(usd<0||lbp<0){alert('Negative values in transaction not allowed.'); return;}
    return fetch(`${SERVER_URL}/timeline`,{
      method: "POST",
      headers: {
        "Content-Type":"application/json",
        Authorization: `bearer ${userToken}`,
      },
      body: JSON.stringify({
        usd_amount: usd,
        lbp_amount: lbp,
        usd_to_lbp: u2l 
      }),
    }).then((response)=>response.json())
    .then((respval) => {
      if(respval.hasOwnProperty('message')) {alert('You do not have the amount of money that you are requesting to exchange'); }
      else {setPostOpen(false)}
    })
    //.then((response)=>login(username, password)); .then make it show on the TL??????? maybe; get function till we get to that. baby steps.
  }

  function loadTimeline(){
    fetch(`${SERVER_URL}/timeline`,{
      headers: {
        Authorization: `bearer ${userToken}`,
      }
    })
    .then(response => response.json())
    .then((posts)=>{setTlPosts(posts); console.log("arrays+ ", tlPosts )});
  };
  useEffect(loadTimeline, [userToken]);


  return (
    <div className="App">
      <div className='navbar'>
        <div className = 'navbar-links'>
          <div className = 'logo'>
           <a href = '/'> <img src = {logo} alt = 'logo'/> </a>
          </div>
        
          <div className = 'navbar-links-container'>
            <p><a href = "#rates">Rates</a></p>
            <p><a href = "#calculator">Calculator</a></p>
            <p><a href = "#timeline">Timeline</a></p>
          </div>
        </div>
        {userToken !== null ? (
              <div className = 'navbar-sign'>
                <p onClick={logout}>Logout</p>
              </div>
            ) : (
              <div className = 'navbar-sign'>
                  <p onClick={() => setAuthState(States.USER_CREATION)} className ='register'> Register</p>
                  <p onClick={() => setAuthState(States.USER_LOG_IN)}> <b> Sign in </b> </p>
              </div>
            )}
        
      </div>
      <UserCredentialsDialog  open={(authState == States.USER_CREATION)? true:false} title ="Get Started!" submitText = "Sign Up" onClose = {()=>setAuthState(States.PENDING)} onSubmit = {(username, password)=>createUser(username, password)}/>
      <UserCredentialsDialog  open={(authState == States.USER_LOG_IN)? true:false} title ="Welcome Back!" submitText = "Sign In" onClose = {()=>setAuthState(States.PENDING)} onSubmit = {(username, password)=> login(username, password)}/>
      <Snackbar 
        elevation = {6} 
        variant = "filled" 
        open = {authState === States.USER_AUTHENTICATED} 
        autoHideDuration = {2000} 
        onClose ={()=> setAuthState(States.PENDING)}
      >
        <Alert severity = "success">Success </Alert>
      </Snackbar>
      <Snackbar
        elevation={6}
        variant="filled"
        open={authState === States.USER_NOT_AUTHENTICATED}
        autoHideDuration={2000}
        onClose={() => setAuthState(States.PENDING)}
        >
        <Alert severity="error">Failed</Alert>
      </Snackbar>
      {!userToken && <Header/>}
      <section id='rates'>
        <div className = "exr">
          <h1>Today's Exchange Rate</h1>
          <div className='rates'>
            <div className = 'glass-card'>
              <h2>LBP to USD - Buy USD:</h2>
              <p>{buyFunction()} </p>
            </div>
            <div className = 'glass-card'>
              <h2>USD to LBP - Sell USD:</h2>
              <p>{sellFunction()}</p>
            </div>
          </div>
          <h1>New Transaction</h1>
          <div className = 'new'>
            <div className = 'glass-card'>
                <h2>Record a recent transaction:</h2>
                <form name="transaction-entry" id = "transaction-entry">
                  <div className="amount-input">
                    <div className='input-container'>
                      <label htmlFor="lbp-amount"> LBP Amount </label>
                      <input id="lbp-amount" type="number" min="0" value={lbpInput} onChange={e =>setLbpInput(e.target.value)}/>
                    </div>
                    <div className = 'input-container'>
                      <label htmlFor="usd-amount"> USD Amount </label>
                      <input id="usd-amount" type="number" min="0" value={usdInput} onChange={f =>setUsdInput(f.target.value)}/>
                    </div>
                      
                  </div>
                  <div className = 'container'>
                    <select id="transaction-type" value = {transactionType} onChange={e=>setTransactionType(e.target.value)}>
                        <option value="usd-to-lbp">USD to LBP</option>
                        <option value="lbp-to-usd">LBP to USD</option>
                    </select>
                    <br></br>
                    <Button variant = "contained" onClick = {addItem} size="small" style={{textAlign: "center"}}>+ Add</Button> 
                  </div>
              </form>
            </div>
          </div>
          <h1>Insights</h1>
          <div className ='insights'></div>
          <h1>Graph</h1>
          <div className='graph'>
            <div className = 'glass-card'>
            <h2>All Transactions</h2>

            <div className="all-transactions">
                <Chart
                  width={'700px'}
                  height={'410px'}
                  chartType="LineChart"
                  loader={<div>Loading Chart</div>}
                  color= "transparent"
                  data={[
                    ['x', 'USD to LBP']
                  ].concat(allUsdTransactions)}
                  options={ {
                    hAxis: {
                      title: 'Time',
                    },
                    vAxis: {
                      title: 'Exchange Rate',
                    },
                    series: {
                      1: { curveType: 'function' },
                    },
                  }}
                  rootProps={{ 'data-testid': '2' }}
                />
                <Chart
                  width={'700px'}
                  height={'410px'}
                  chartType="LineChart"
                  loader={<div>Loading Chart</div>}
                  color= "transparent"
                  data={[
                    ['x', 'LBP to USD']
                  ].concat(allLbpTransactions)}
                  options={ {
                    hAxis: {
                      title: 'Time',
                    },
                    vAxis: {
                      title: 'Exchange Rate',
                    },
                    series: {
                      1: { curveType: 'function' },
                    },
                  }}
                  rootProps={{ 'data-testid': '2' }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id ='calculator'>
        <h1> Calculator </h1>
        <p className='p-calc'> Both fields can be changed in either column (backwards calculation). The difference is the rate in question depending on the direction of the transaction. </p>
        <div className = 'calc-container'>
          <div className = 'glass-card'>
            <div className='calc'>
              <h3> Buy USD (LBP to USD)</h3>
              <input id ="lira"  type="number" min="0" value = {lAmount1} onChange = {(e)=>{
                if(e.target.value>=0) {setAmount(e.target.value); setFromLBP(true);}
                else alert('Negative values in transaction not allowed.'); return;
                }}/>
              &nbsp; LBP <br/>
            <span className='equals'> = </span> <br/>
              <input id = "dollar" type="number" min="0" value = {uAmount1} onChange = {(e)=>{
                if(e.target.value>=0) {setAmount(e.target.value); setFromLBP(false);}
                else alert('Negative values in transaction not allowed.'); return;
                }}/>
              &nbsp; USD 
            </div>
            <div className='calc2'>
              <h3> Sell USD (USD to LBP)</h3>
              <input id ="lira"  type="number" min="0" value = {lAmount2} onChange = {(e)=>{
                if(e.target.value>=0) {setAmount2(e.target.value); setFromLBP2(true);}
                else alert('Negative values in transaction not allowed.'); return;
                }}/>
              &nbsp; LBP <br/>
            <span className='equals'> = </span> <br/>
              <input id = "dollar" type="number" min="0" value = {uAmount2} onChange = {(e)=>{
                if(e.target.value>=0) {setAmount2(e.target.value); setFromLBP2(false);}
                else alert('Negative values in transaction not allowed.'); return;
                }}/>
              &nbsp; USD 
            </div>
          </div>
          
        </div>
      </section>
      <section id = 'timeline'>
        <h1>Timeline</h1>
        <FormPost open={postOpen} title ="Post Request" submitText = "Post" onClose = {()=>setPostOpen(false)} onSubmit = {(usdpost, lbppost,type)=> {postTimeline(usdpost,lbppost,type)}}/>
        <div className = 'timeline-container'>
          <div className='glass-card' id ="tlgc">
            {!userToken && <span class='p-tl' onClick={() => setAuthState(States.USER_LOG_IN)}> Please <b>login </b> to see the posted requests.</span>}
            {userToken && 
            <div className = 'posts-container'>
              <h2> All pending transactions:</h2>               
              <Box textAlign='center'>
                <Button variant = "contained" onClick = {()=>{setPostOpen(true)}} size="small" style={{textAlign: "center", maxWidth: '300px', background:'linear-gradient(92.09deg, #102A34 -19.26%, #6EA4B9 162.27%)'}}>+ Add Request</Button> 
              </Box>
              {/* <div className = 'glass-card'>
                <h3>Dina Younes - Buy USD:</h3>
                <div id = 'postxt'><b>Amount:</b> $30 
                <br/> <b>Rate:</b> 20000 LBP
                </div>
              </div>
              <div className = 'glass-card'>
                Post
              </div>
              <div className = 'glass-card'>
                Post
              </div> */}
              <ul>{[...Array(tlPosts.length)].map((e, i) => {
                  return <li key={tlPosts[i]['id']}>
                    <div className = 'gc-flex'>
                      <div className = 'glass-card'>
                        <h3> {tlPosts[i]['user_to']} - {(tlPosts[i]['usd_to_lbp'])?'Sell USD':'Buy USD'}:</h3>
                        <div id = 'postxt'><b>Amount:</b> {(tlPosts[i]['usd_to_lbp'])?('$ '+tlPosts[i]['usd_amount']):(tlPosts[i]['lbp_amount']+' LBP')} 
                        <br/> <b>Rate:</b> {`1 USD at ${(tlPosts[i]['lbp_amount']/tlPosts[i]['usd_amount']).toFixed(2)} LBP`}
                        </div>
                      </div>
                      <button type = "button">Exchange</button>
                    </div>
                  </li>
                })}</ul>

            </div>
            }
          </div>
        </div>
        
      </section>
      <section id = 'table'>
        {userToken && <h1>Your Transactions</h1>}
        <div className='glass-card'>
        {userToken && (
                <div className="wrapper ">
                  <Typography variant="h5">Your Transactions with Tellers</Typography>
                  <DataGrid
                  HorizontalAlign = 'Center'
                  columns = {[
                    {
                      field: 'id',
                      headerName: 'ID',
                      width: 90
                    },
                    {
                      field: 'lbp_amount',
                      headerName: 'LBP Amount',
                      width: 150
                    },
                    {
                      field: 'usd_amount',
                      headerName: 'USD Amount',
                      width: 150
                    },
                    {
                      field: 'usd_to_lbp',
                      headerName: 'USD to LBP',
                      width: 90
                    },
                    {
                      field: 'user_id',
                      headerName: 'User ID',
                      width: 90
                    }
                  ]}
                  rows={userTransactions}
                  autoHeight
                  />
                </div>
        )} 
        </div>

      </section>
    </div>
  );
}

export default App;
