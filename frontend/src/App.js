import './App.css';
import logo from './images/logo.png';

import { useState, useEffect, useCallback } from "react";
import { Alert, AppBar, Box, Button, Dialog, FormControl, FormControlLabel, RadioGroup, Snackbar, Toolbar, Typography } from '@mui/material';
import  { getUserToken, saveUserToken, clearUserToken } from "./localStorage";
import { DataGrid } from '@mui/x-data-grid';
import Chart from 'react-google-charts'



import Navbar from './components/Navbar/Navbar';
import Header from './components/Header/Header'
import FormPost from './components/FormPost/FormPost';
import UserCredentialsDialog from './components/UserCredentialsDialog/UserCredentialsDialog';
import Radio from '@mui/material/Radio';


const States = {
  PENDING: "PENDING",
  USER_CREATION: "USER_CREATION",
  USER_LOG_IN: "USER_LOG_IN",
  USER_AUTHENTICATED: "USER_AUTHENTICATED",
  USER_NOT_AUTHENTICATED: "USER_NOT_AUTHENTICATED"
 };

 
 var SERVER_URL = "http://127.0.0.1:5000";

 /* Helper functions */

 function postDisabled(usd_to_lbp, usd_amount, usd_balance, lbp_amount, lbp_balance){
   return (usd_to_lbp==1)?(lbp_amount>lbp_balance):(usd_amount>usd_balance);
 }

 // moving average for plot / fluctuation of rates in a format that a graph will accept
 function movingAverage(array){
    if(array ==undefined){return [[0,0]]} // edge case
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
    else{return [[0,0]]} // edge case (no transaction)
 }

 // good formating to calculate insights 
 function concat2(arr1, arr2){
   for(var i =1; i<arr1.length; i++){
     arr1[i].push(arr2[i][1]-arr2[i-1][1]);
   }
   arr1[0].push(arr2[0][1]);
   return arr1;
 }

 

 function insightFormat(array){
   if(array.length == 0){return array;}
 }
 
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

  // states for the table displaying all transactions
  let [userTransactions, setUserTransactions] = useState([]);
  let [tellerTransactions, setTellerTransactions] = useState([]);

  // state of pop up dialog
  let [postOpen, setPostOpen]= useState(false);

  // state of balance dialog
  let [balanceOpen, setBalanceOpen] = useState(false)

  // list of all posts on the timeline
  let [tlPosts, setTlPosts] = useState([]);
  
  // list of all your timeline contributions
  let [yourPosts, setYourPosts] = useState([]);

  // helpful for charting; basically a moving average of the transactions
  let [allUsdTransactions, setAllUsdTransactions]= useState([]);
  let [allLbpTransactions, setAllLbpTransactions]= useState([]);

  // same thing but with your transactions
  let [allYourUsdTransactions, setAllYourUsdTransactions]= useState([]);
  let [allYourLbpTransactions, setAllYourLbpTransactions]= useState([]);

  // your USD and LBP balances. They change as you engage in transactions with other users.
  let [usdBalance, setUsdBalance] = useState(0)
  let [lbpBalance, setLbpBalance] = useState(0)

  // sets the timeline you're trying to see
  let [who, setWho] = useState("All")

  let [insightUSD, setInsightUSD] = useState([])
  let [insightLBP, setInsightLBP] = useState([])
  // better format
  let [fInsightUSD, setfInsightUSD] = useState([])
  let [fInsightLBP, setfInsightLBP] = useState([])

  // this block of code is for the calculator section (dynamic response of field change)
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

  /* All Routes */
  
  // Route to display rates
  function fetchRates() { // retrieve exchange rates and update the UI
    fetch(`${SERVER_URL}/exchangeRate`)
    .then(response => response.json())
    .then(data =>{
      setSellUsdRate(data['usd_to_lbp']);
      setBuyUsdRate(data['lbp_to_usd']);
    });
  }
  useEffect(fetchRates, []);

  // Route to fetch the user's balance and update the state
  function fetchBalance(){
    fetch(`${SERVER_URL}/balance`, {
      headers:{
      Authorization: `bearer ${userToken}`,
    }})
    .then(response=>response.json())
    .then(data =>{
      setUsdBalance(data['usd_balance']);
      setLbpBalance(data['lbp_balance']);
    })
  }
  useEffect(fetchBalance,[userToken, lbpBalance, usdBalance]);
  // const fetchBalance = useCallback(()=>{ 
  //   fetch(`${SERVER_URL}/balance`, {
  //     headers:{
  //     Authorization: `bearer ${userToken}`,
  //   }})
  //   .then(response=>response.json())
  //   .then(data =>{
  //     setUsdBalance(data['usd_balance']);
  //     setLbpBalance(data['lbp_balance']);
  //   })
  // },[userToken, lbpBalance, usdBalance]);

  // Route to plot all transactions buy retrieving the arrays
  function plotAll(){
    fetch(`${SERVER_URL}/plotall`)
    .then(response=>response.json())
    .then(transactions=>{
      setAllUsdTransactions(movingAverage(transactions['usd_to_lbp_rates'])); 
      setAllLbpTransactions(movingAverage(transactions['lbp_to_usd_rates'])); 
  })
  

  }
  useEffect(plotAll, []);

  // Route to plot all user effect on exchange rate
  function plotUser(){
    fetch(`${SERVER_URL}/plotuser`,{
      headers: {
        'Authorization': `bearer ${userToken}`
      }
    })
    .then(response=>response.json())
    .then(transactions=>{
      setAllYourUsdTransactions(movingAverage(transactions['usd_to_lbp_rates_uto'])); 
      setAllYourLbpTransactions(movingAverage(transactions['lbp_to_usd_rates_uto'])); 
  })
  }
  useEffect(plotUser, [userToken]);

  // route to fetch user all transactions with the corresponding exchange rate caused
  function insights(){
    fetch(`${SERVER_URL}/fetcheverything`)
    .then(response=>response.json())
    .then(transactions=>{
      setInsightUSD(transactions['usd_to_lbp']);
      setInsightLBP(transactions['lbp_to_usd']);
      console.log(insightUSD, "insights");
    })
    .then(
      ()=>{
        setfInsightUSD(concat2(insightUSD, allUsdTransactions)); console.log(fInsightUSD, allUsdTransactions);
        setfInsightLBP(concat2(insightLBP, allLbpTransactions)); console.log(fInsightLBP, allLbpTransactions);
      }
    )
  }
  useEffect(insights, [allUsdTransactions]);

  // route to add a transaction
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
    .then((respval) => {
      if(respval.hasOwnProperty('message')) {alert('You do not have the amount of money needed for this exchange.'); }
      else{
        fetchRates(); plotAll(); plotUser(); insights();
        setUsdInput(""); 
        setLbpInput(""); 
        if(userToken){
          fetchUserTransactions();
        }
      }
    })
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
    if(username=="") {alert("Username is empty!"); return;}
    if(password.length < 8) {alert("Password length is below requirement (8 characters)!"); return;}
    for(let i=0; i<username.length; i++){
      if(!(username.charAt(i)>='0' && username.charAt(i)<='9') && !(username.charAt(i)>='a' && username.charAt(i)<='z') && !(username.charAt(i)>='A' && username.charAt(i)<='Z')){
        alert("Username can only contain digits and English letters. Please remove any special characters.");
        return;
      }
    }
    if(username.charAt(0)>='0' && username.charAt(0)<='9'){alert("Username cannot start with a diigit."); return;}
    var found=0;
    for(let i=0; i<password.length; i++){
      if(!(password.charAt(i)>='0' && password.charAt(i)<='9') && !(password.charAt(i)>='a' && password.charAt(i)<='z') && !(password.charAt(i)>='A' && password.charAt(i)<='Z')){
        found=1; break;
      }
    }
    if(found==0){alert("Please include a special character for a stronger password. (Any character that is not a digit or English letter is considered a special character.)"); return;}
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
      .then((transactions)=>{
        for(let i=0; i<transactions['teller'].length; i++){
          transactions['teller'][i]['usd_to_lbp'] = transactions['teller'][i]['usd_to_lbp'] ? 'LBP' : 'USD'
        }
        setTellerTransactions(transactions['teller']);
        for(let i=0; i<transactions['user'].length; i++){
          transactions['user'][i]['user_from_id'] = transactions['mapping'][transactions['user'][i]['user_from_id']]
          transactions['user'][i]['user_to_id'] = transactions['mapping'][transactions['user'][i]['user_to_id']]
          transactions['user'][i]['usd_to_lbp'] = transactions['user'][i]['usd_to_lbp'] ? 'LBP' : 'USD'
        }
        setUserTransactions(transactions['user']);
        console.log(transactions);});
  },[userToken]);

  useEffect(()=>{
    if(userToken){
      fetchUserTransactions();
    }
  }, [fetchUserTransactions, userToken]);

  // route to fetch all the posts on the timeline (inter-user transactions)
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

  // route to retrieve the timeline consisting of your own posts
  function loadYourTimeline(){
    fetch(`${SERVER_URL}/mytimeline`,{
      headers: {
        Authorization: `bearer ${userToken}`,
      }
    })
    .then(response => response.json())
    .then((posts)=>{setYourPosts(posts); });
  };
  useEffect(loadYourTimeline, [userToken, postOpen]);

  // route to post a request on the timeline
  function postTimeline(usd,lbp, u2l){
    if(usd == ""||lbp==""){alert('Empty field!'); return;}
    if(usd==0||lbp==0){alert('Null transactions are not allowed.'); return;}
    if(usd<0||lbp<0){alert('Negative values in transactions are not allowed.'); return;}
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
    .then(loadYourTimeline())
    .then((respval) => {
      if(respval.hasOwnProperty('message')) {alert('You do not have the amount of money that you are requesting to exchange'); }
      else {setPostOpen(false)}
    })
    //.then((response)=>login(username, password)); .then make it show on the TL??????? maybe; get function till we get to that. baby steps.
  }

  // route to perform a transaction with another user
  function exchange(id){
    fetch(`${SERVER_URL}/timelineconfirm`,{
      method: 'POST',
      headers: {
          'Content-Type':'application/json',
          'Authorization': `bearer ${userToken}`
      },
      body: JSON.stringify({
          id: id
      })
    })
    .then(()=>{fetchBalance(); loadTimeline(); loadYourTimeline(); fetchUserTransactions();})
  };
  
  // route to delete a posted transaction

  function deletePost(id){
    fetch(`${SERVER_URL}/deleterequest`,{
      method: 'POST',
      headers: {
          'Content-Type':'application/json',
          'Authorization': `bearer ${userToken}`
      },
      body: JSON.stringify({
          id: id
      })
    })
    .then(()=>{fetchBalance(); loadTimeline(); loadYourTimeline();})
  };

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
                <p onClick = {()=>setBalanceOpen(true)}>Balance </p>
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
      <Dialog open = {balanceOpen} onClose = {()=>setBalanceOpen(false)} id = "balance-dialog" style={{'min-width':'1000px'}}>
        <div className ='balance'>
          <h1> Your Balance: </h1>
          <div className="balances">
            <div className= "glass-card">
              <h2>USD Balance:</h2>
              <p>${usdBalance}</p>
            </div>
            <div  className= "glass-card">
              <h2>LBP Balance</h2>
              <p> {lbpBalance} LBP</p>
            </div>
          </div>
        </div>
      </Dialog>
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
          <p className = 'p-calc'> Effect of every transaction on the rate:</p>
          <div className ='insights'>
            <div glass-card id = 'ingc'>
              <div className = 'usd-in'>
                <ul>{[...Array(fInsightUSD.length)].map((e, i) => {
                        return <li key={i}>
                          <div className = 'gc-flex'>
                            <div className = 'glass-card'>
                              <h3> {fInsightUSD[i][0]} USD - {(fInsightUSD[i][1])} LBP:</h3>
                              <p> Buy USD </p>
                              <div id = 'button-text'>
                                <b>Effect on Buy USD Rate: </b> <br/>{(fInsightUSD[i][2]>0)&&'+'}{fInsightUSD[i][2]} <br/> 
                              
                              </div>
                            </div>
                            
                          </div>
                        </li>
                      })}</ul>
                </div>
                <div className = 'lbp-in'>
                <ul>{[...Array(fInsightLBP.length)].map((e, i) => {
                        return <li key={i}>
                          <div className = 'gc-flex'>
                            <div className = 'glass-card'>
                              <h3> {fInsightLBP[i][0]} USD - {(fInsightLBP[i][1])} LBP:</h3>
                              <p> Sell USD  </p>
                              <div id = 'button-text'>
                                <b>Effect on Sell USD Rate: </b>  <br/>{(fInsightLBP[i][2]>0)&&'+'}{fInsightLBP[i][2]} <br/> 
                              
                              </div>
                            </div>
                            
                          </div>
                        </li>
                      })}</ul>
                  </div>
            </div>
          </div>
          <h1>Graph</h1>
          <div className='graph'>
            <div className = 'glass-card'>
              <h2>All Transactions</h2>

              <div className="all-transactions">
                  <Chart
                    width={'625px'}
                    height={'360px'}
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
                        minValue: 0
                      },
                      series: {
                        1: { curveType: 'function' },
                      },
                    }}
                    rootProps={{ 'data-testid': '2' }}
                  />
                  <Chart
                    width={'625px'}
                    height={'360px'}
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
                        minValue: 0
                      },
                      series: {
                        1: { curveType: 'function' },
                      },
                    }}
                    rootProps={{ 'data-testid': '2' }}
                  />
                </div>


              {userToken && 
              <>
              <h2>User Transactions</h2>
              <p>See how your transactions affected the exchange rate. </p>
              <div className="user-transactions">
                  <Chart
                    width={'625px'}
                    height={'360px'}
                    chartType="LineChart"
                    loader={<div>Loading Chart</div>}
                    color= "transparent"
                    data={[
                      ['x', 'USD to LBP']
                    ].concat(allYourUsdTransactions)}
                    options={ {
                      hAxis: {
                        title: 'Time',
                      },
                      vAxis: {
                        title: 'Exchange Rate',
                        minValue: 0
                      },
                      series: {
                        1: { curveType: 'function' },
                      },
                    }}
                    rootProps={{ 'data-testid': '2' }}
                  />
                  <Chart
                    width={'625px'}
                    height={'360px'}
                    chartType="LineChart"
                    loader={<div>Loading Chart</div>}
                    color= "transparent"
                    data={[
                      ['x', 'LBP to USD']
                    ].concat(allYourLbpTransactions)}
                    options={ {
                      hAxis: {
                        title: 'Time',
                      },
                      vAxis: {
                        title: 'Exchange Rate',
                        minValue: 0
                      },
                      series: {
                        1: { curveType: 'function' },
                      },
                    }}
                    rootProps={{ 'data-testid': '2' }}
                  />
                </div> </>}
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
        <FormPost open={postOpen} title ="Post Request" submitText = "Post" onClose = {()=>setPostOpen(false)} average = "5" onSubmit = {(usdpost, lbppost,type)=> {postTimeline(usdpost,lbppost,type)}}/>
        
        <div className = 'timeline-container'>
        
            {!userToken &&
            <div style={{height:120}} className='glass-card'>
            <span className='p-tl' onClick={() => setAuthState(States.USER_LOG_IN)}> Please <b>login </b> to see the posted requests.</span>
            </div>}

            {userToken && 
            <div className='glass-card' id ="tlgc">
            <div className = 'posts-container'>
              <FormControl id = 'radio-control'>
                <RadioGroup
                  row
                  aria-labelledby="demo-row-radio-buttons-group-label"
                  name="row-radio-buttons-group"
                  value = {who}
                  onChange = {(e)=>{setWho(e.target.value)}}
                >
                  <FormControlLabel value ="All" control = {<Radio/>} label = "All"/>
                  <FormControlLabel value ="User" control = {<Radio/>} label = "Yours"/>
                </RadioGroup>
              </FormControl>
              {(who=="All")
              &&<div>
                <h2> All pending transactions:</h2>               
                <ul>{[...Array(tlPosts.length)].map((e, i) => {
                    return <li key={tlPosts[i]['id']}>
                      <div className = 'gc-flex'>
                        <div className = 'glass-card'>
                          <h3> {tlPosts[i]['user_to']} - {(tlPosts[i]['usd_to_lbp'])?'Buy LBP':'Buy USD'}:</h3>
                          <div id = 'postxt'>
                            <b>Amount:</b> {(tlPosts[i]['usd_to_lbp'])?(tlPosts[i]['lbp_amount'] + ' LBP'):('$ '+ tlPosts[i]['usd_amount'])} <br/> 
                            <b>For:</b> {(tlPosts[i]['usd_to_lbp'])?('$ '+ tlPosts[i]['usd_amount']):(tlPosts[i]['lbp_amount'] +' LBP')} <br/> 
                            <b>Rate:</b> {`1 USD at ${(tlPosts[i]['lbp_amount']/tlPosts[i]['usd_amount']).toFixed(2)} LBP`} <br/>      
                          </div>
                        </div>
                        <div className = "button-text">
                          <button type = "button" disabled = {postDisabled(tlPosts[i]['usd_to_lbp'], tlPosts[i]['usd_amount'], usdBalance, tlPosts[i]['lbp_amount'],lbpBalance)} onClick = {()=>{exchange(tlPosts[i]['id'])}}>Exchange</button>
                          <div className="hide">Insufficient funds!</div>
                        </div>
                        
                      </div>
                    </li>
                  })}</ul>
                </div>}
                {(who=="User")
                  &&
                  <div>
                    <h2> Your requests:</h2>    
                    <Box textAlign='center'>
                    <Button variant = "contained" onClick = {()=>{setPostOpen(true)}} size="small" style={{textAlign: "center", maxWidth: '300px', background:'linear-gradient(92.09deg, #102A34 -19.26%, #6EA4B9 162.27%)'}}>+ Add Request</Button> 
                    </Box>
                      <ul>{[...Array(yourPosts.length)].map((e, i) => {
                      return <li key={yourPosts[i]['id']}>
                        <div className = 'gc-flex'>
                          <div className = 'glass-card'>
                            <h3> You ({yourPosts[i]['user_to']}) - {(yourPosts[i]['usd_to_lbp'])?'Buy LBP':'Buy USD'}:</h3>
                            <div id = 'postxt'>
                            <b>Amount:</b> {(yourPosts[i]['usd_to_lbp'])?(yourPosts[i]['lbp_amount'] + ' LBP'):('$ '+ yourPosts[i]['usd_amount'])} <br/> 
                            <b>For:</b> {(yourPosts[i]['usd_to_lbp'])?('$ '+ yourPosts[i]['usd_amount']):(yourPosts[i]['lbp_amount'] +' LBP')} <br/> 
                            <b>Rate:</b> {`1 USD at ${(yourPosts[i]['lbp_amount']/yourPosts[i]['usd_amount']).toFixed(2)} LBP`} <br/>  
                            </div>
                          </div>
                          <div className = "button-text">
                            <button type = "button" onClick = {()=>{deletePost(yourPosts[i]['id'])}} >Delete</button>
                          </div>
                          
                        </div>
                      </li>
                    })}</ul>
                  </div>
                }
              </div>
            </div>
            }
          </div>        
      </section>
      <section id = 'table'>
          {userToken && <h1>Your Transactions</h1>}
          <div className='glass-card' style={{marginLeft:15, width: 525, float: 'left',  backgroundColor: "#3A6170"}} >
          {userToken && (
                  <div className="wrapper ">
                    <Typography style={{marginTop:4, marginBottom:4}} variant="h5">Your Transactions with Tellers</Typography>
                    <DataGrid style={{color: "cornsilk"}}
                    HorizontalAlign = 'Center'
                    columns = {[
                      {
                        field: 'lbp_amount',
                        headerName: 'LBP Amount',
                        flex: 1
                      },
                      {
                        field: 'usd_amount',
                        headerName: 'USD Amount',
                        flex: 1
                      },
                      {
                        field: 'usd_to_lbp',
                        headerName: 'Currency Bought',
                        flex: 1
                      }
                    ]}
                    rows={tellerTransactions}
                    autoHeight
                    />
                  </div>
          )} 
          </div>
          <div className='glass-card' style={{marginRight:15, width: 675, float:'right', backgroundColor: "#3A6170"}}>
          {userToken && (
                  <div width="450px" className="wrapper ">
                    <Typography style={{marginTop:4, marginBottom:4}} variant="h5" >Your Transactions with Users</Typography>
                    <DataGrid style={{color: "cornsilk"}}
                    HorizontalAlign = 'Center'
                    columns = {[
                      {
                        field: 'user_to_id',
                        headerName: 'To',
                        flex: 1
                      },
                      {
                        field: 'user_from_id',
                        headerName: 'From',
                        flex: 1
                      },
                      {
                        field: 'lbp_amount',
                        headerName: 'LBP Amount',
                        flex: 1
                      },
                      {
                        field: 'usd_amount',
                        headerName: 'USD Amount',
                        flex: 1
                      },
                      {
                        field: 'usd_to_lbp',
                        headerName: 'Currency Bought',
                        flex: 1
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
