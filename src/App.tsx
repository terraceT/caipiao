import React,{useState,useEffect} from 'react';
import './App.css';
import web3 from'./utils/initWeb3';
import { abi,contractAddr,dataAddr,dataAbi } from './utils/abi'

function App() {
  const [contractIns, setContractIns] = useState<any>({})                  //彩票合约
  const [dataContractIns, setDataContractIns] = useState<any>({})  //数据合约
  const [account, setaccount] = useState('')                                       //用户账户
  const [userBalance, setUserBalance] = useState('')                          //用户账户余额
  const [contractBalance, setContractBalance] = useState('')             //合约账户余额

  const [unitPrice, setUnitPrice] = useState('')        //彩票单价
  const [inputPrice, setInputPrice] = useState('')   //输入的彩票价格
  const [bigPrize, setBigPrize] = useState('')          //大奖奖金                      
  const [smallPrize, setSmallPrize] = useState('')   //小奖奖金
  const [inputBigPrize, setInputBigPrize] = useState('')          //输入的大奖奖金                      
  const [inputSmallPrize, setInputSmallPrize] = useState('')   //输入的小奖奖金

  const [numberTemp, setNumberTemp] = useState('')  //号码，方便测试用，开奖后仍可以继续购买指定期数的彩票
  const [periodTemp, setPeriodTemp] = useState('')       //期数，方便测试用，开奖后仍可以继续购买指定期数的彩票

  const [number, setNumber] = useState('')    //购买彩票号码         
  const [quantity, setQuantity] = useState('')   //购买彩票注数

  const [inputExchangeNumber, setInputExchangeNumber] = useState('')  //输入的兑奖号码
  const [inputExchangePeriod, setInputExchangePeriod] = useState('')         //输入的兑奖期数

  const [selectedPeriod, setSelectedPeriod] = useState('')                            //查看哪一期
  const [selectedTickets, setSelectedTickets] = useState([])                          //查询用户购买的指定期数的彩票

  const [openNumberList, setOpenNumberList] = useState([])                    //开奖号码列表

  useEffect(() => {
    (async ()=>{
      let lotteryContract  = await new web3.eth.Contract(abi, contractAddr)  //彩票合约
      setContractIns(lotteryContract);
      let dataContract = await new web3.eth.Contract(dataAbi, dataAddr)    //数据合约
      setDataContractIns(dataContract)
      let acc = await (window as any).ethereum.request({ method: "eth_requestAccounts" }) //获取账户
      setaccount(acc[0]);
      console.log('acccount:',acc[0]);
      // 返回指定地址账户的余额
      let balance = await web3.eth.getBalance(acc[0]);  //获取用户账户余额
      balance=web3.utils.fromWei(balance)
      setUserBalance(balance);
      console.log(balance);
      let data = await lotteryContract.methods.getbalance().call({  //获取合约账户余额
        from:account
      })
      let bal=web3.utils.fromWei(data)
      setContractBalance(bal);
      let price = await lotteryContract.methods.getUnitPrice().call(); //查询彩票单价
      console.log('price:',price);
      setUnitPrice(web3.utils.fromWei(price));
      let big = await lotteryContract.methods.getBigPrize().call(); //查询大奖奖金
      setBigPrize(web3.utils.fromWei(big));
      let small = await lotteryContract.methods.getSmallPrize().call(); //查询小奖奖金
      setSmallPrize(web3.utils.fromWei(small));
      let lotteryList = await lotteryContract.methods.getOpenNumberList().call();  //查询开奖号码列表
      setOpenNumberList(lotteryList)
      let selectedTickets = await lotteryContract.methods.getSelectedTickets(lotteryList.length).call();  //查询当前期的用户彩票
      console.log('getSelectedTickets',selectedTickets);
      setSelectedTickets(selectedTickets);
    })()
  }, [])

  //查询合约总余额
  const getContractBalance = async() =>{
    let data = await contractIns.methods.getbalance().call({
        from:account
    })
    console.log('getbalance',data);
    let balance=web3.utils.fromWei(data)
    setContractBalance(balance);
  }

  //获取用户账户余额 
  const getUserBalance = async() =>{
    let balance = await web3.eth.getBalance(account);  
    balance=web3.utils.fromWei(balance)
    setUserBalance(balance);

    getContractBalance();
  }

  //将数据合约的所有权转给彩票合约地址
  const transferOwnership = async () => {
    await dataContractIns.methods.transferOwnership(contractAddr).send({
      from:account
    });
  }

  //将数据合约的所有权从彩票合约地址转回来
  const transferOwnershipTome = async () => {
    await contractIns.methods.transferOwnership().send({
      from:account
    });
  }

  //设置合约暂停状态
  const setPause = async (pauseStatus:boolean) =>{
    let data = await contractIns.methods.setPaused(pauseStatus).send({
      from:account
    })
    console.log(data);
  }

  //设置彩票单价
  const toSetUnitPrice = async () =>{
    if(!inputPrice)
    {
      alert("请输入彩票单价");
      return;
    }

    let iPrice = inputPrice;
    //如果最后一个是小数点，去掉它
    if(inputPrice.indexOf(".") +1 == inputPrice.length)
    {
      iPrice=inputPrice.substr(0,inputPrice.length-1);
      setInputPrice(iPrice);
    }

    await contractIns.methods.setUnitPrice(web3.utils.toWei(iPrice)).send({     
      from:account
    })
    setUnitPrice(iPrice)

    getUserBalance();
  }

  //设置奖金
  const setPrize = async () =>{
    if(!inputBigPrize)
    {
      alert("请输入匹配4个数奖金金额");
      return;
    }

    if(!inputSmallPrize)
    {
      alert("请输入匹配3个数奖金金额");
      return;
    }

    let iBigPrize = inputBigPrize;
    //如果最后一个是小数点，去掉它
    if(inputBigPrize.indexOf(".") +1 == inputBigPrize.length)
    {
      iBigPrize=inputBigPrize.substr(0,inputBigPrize.length-1);
      setInputBigPrize(iBigPrize);
    }

    let iSmallPrize = inputSmallPrize;
    //如果最后一个是小数点，去掉它
    if(inputSmallPrize.indexOf(".") +1 == inputSmallPrize.length)
    {
      iSmallPrize=inputSmallPrize.substr(0,inputSmallPrize.length-1);
      setInputSmallPrize(iSmallPrize);
    }

    let big =  web3.utils.toWei(iBigPrize)
    let small =  web3.utils.toWei(iSmallPrize)
    console.log('test：',big,small);
    let data = await contractIns.methods.setPrize(big,small).send({
      from:account
    })
    console.log('data:',data);
    setBigPrize(iBigPrize)
    setSmallPrize(iSmallPrize)

    getUserBalance();
  }

  //查询奖金金额
  const getPrize = async () => {
    getBigPrize();
    getSmallPrize();
  }

  //查询大奖奖金金额
  const getBigPrize = async () => {
    let data = await contractIns.methods.getBigPrize().call()
    console.log('getBigPrize',data);
    let big =  web3.utils.fromWei(data)
    setBigPrize(big)
  }

  //查询小奖奖金金额
  const getSmallPrize = async () => {
    let data = await contractIns.methods.getSmallPrize().call()
    console.log('getSmallPrize',data);
    let small =  web3.utils.fromWei(data)
    setSmallPrize(small)
  }

  //获取当前期用户购买的彩票列表
  const getTickets = async (currentPeriod = openNumberList.length)=>{  
    console.log(';openNumberList',openNumberList);
    let data = await contractIns.methods.getSelectedTickets(currentPeriod).call({
      from:account
    })
    console.log('getTickets',data);
    setSelectedTickets(data)
  }

  //开奖
  const draw = async () =>{
    let data1 = await contractIns.methods.draw().send({
      from:account
    })
    let data2 = await contractIns.methods.getOpenNumberList().call({  //重新获取开奖号码列表
      from:account
    })
    console.log('draw',data1,'openNumberList',data2);
    setOpenNumberList(data2)

    getUserBalance();
  }

  //购买彩票的处理函数
  const play = async ()=>{
    console.log('number',number);
    let quantityValue=0;
    let value=0;
    if(!number) {  //如果为空，即没有输入号码
      console.log('unitPrice:',unitPrice);
      if(!quantity) //如果为空，即没有输入注数
      {
          //没有输入注数，则默认为1注
          quantityValue = 1;
      }
      else if(parseInt(quantity) == 0)  //如果为0
      {
        alert('请输入注数');
        return;
      }
      else
      {
        quantityValue = Number(quantity);
      }
      value =Number(unitPrice)*quantityValue   //购买总金额
      value = web3.utils.toWei(String(value.toFixed(5)))
      console.log('quantity',quantityValue);    
      console.log('value',value);    
      await contractIns.methods.playRandom(quantityValue).send({  //机选
        from: account,
        gas: '3000000',
        value: value
      })
    } 
    else {  //输入了号码
      if(number.length !== 4){      //校验4位数
        alert('请输入四位号码')
      } 
      else
      {
          if(!quantity) //如果为空，即没有输入注数
          {
              //没有输入注数，则默认为1注
              quantityValue = 1;
          }
          else if(parseInt(quantity) == 0)  //如果为0
          {
            alert('请输入注数');
            return;
          }
          else
          {
            quantityValue = Number(quantity);
          }
          value =Number(unitPrice)*quantityValue  //购买总金额
          value = web3.utils.toWei(String(value.toFixed(5)))
          console.log('value',value);
          let data = await contractIns.methods.play(number,quantityValue).send({  //人选
            from: account,
            gas: '3000000',
            value: value
          })
          console.log('playdata:',data);
      }
    }
    
    getTickets();  //显示当前期用户购买的彩票

    getUserBalance();
  }

  //兑奖
  const exchange = async () =>{
    if(inputExchangeNumber.length !== 4) {
      alert('请输入四位兑奖号码')
      return;
    } 
    if(!inputExchangePeriod) {
      alert('请输入兑奖期数')
      return;
    } 
    
    if(Number(inputExchangePeriod) >= openNumberList.length)
    {
      alert('尚未开奖')
      return;
    }
    
    /* 
    let openNumber = openNumberList[Number(inputExchangePeriod)]
    let iNumber = Number(inputExchangeNumber);
    if(iNumber != openNumber)
    {
      alert('未中大奖');
    } 
    */

    let data = await contractIns.methods.exchange(inputExchangeNumber,inputExchangePeriod).send({
        from:account
    })
    console.log('data:',data);

    getUserBalance();
  }

  //方便测试用，开奖后仍可以继续购买指定期数的彩票
  const setTicketTemp = async () =>{
    if(numberTemp.length !== 4){      //校验4位数
      alert('请输入四位号码')
      return;
    } 
    else
    {
        if(!periodTemp)
        {
          alert('请输入期数')
          return;
        }
    }
    console.log('numberTemp:',numberTemp);
    console.log('periodTemp:',periodTemp);
    let data = await contractIns.methods.setTicketTemp(periodTemp,numberTemp).send({
      from:account
    })
    console.log('data:',data);
    getTickets();  //更新当前期用户购买的彩票

    getUserBalance();
  }

  const NumberCheck = (num:string) => {
    var str = num;
    var len1 = str.substr(0, 1);
    var len2 = str.substr(1, 1);
    //如果第一位是0，第二位不是点，就去掉前面多余的0
    while(str.length > 1 && len1== "0" && len2 != ".") {
        str = str.substr(1);
        len1 = str.substr(0, 1);
        len2 = str.substr(1, 1);
    }
    
    //第一位不能是.
    while (len1 == ".") {
      str = str.substr(1);
      len1 = str.substr(0, 1);
    }

    //限制只能输入一个小数点
    while(str.indexOf(".") != -1) {
      var str_ = str.substr(str.indexOf(".") + 1);
      if (str_.indexOf(".") != -1) {
        str = str.substr(0, str.indexOf(".") + str_.indexOf(".") + 1);
      }
      else
      {
        break;
      }
    }

    //正则替换，保留数字和小数点
    str = str.replace(/[^\d^\.]+/g,'')
    //如果需要保留小数点后两位，则用下面公式
    //str = str.replace(/\.\d\d$/,'')
    return str;
  }
  
  return (
    <div style={{padding:'10px'}}>
      <h2>管理员设置页面</h2>
      <div style={{marginBottom:'10px',padding:'10px',border:'1px solid #000'}}>
          <h4>数据的所有权转移</h4>
          <button onClick={transferOwnership}>转移数据的所有权到彩票</button>
          <button onClick={transferOwnershipTome} style={{marginLeft:'20px'}}>转移数据的所有权到当前用户</button>
          <button onClick={()=>setPause(true)} style={{marginLeft:'20px'}}>暂停运行合约</button>
          <button onClick={()=>setPause(false)} style={{marginLeft:'20px'}}>继续运行合约</button>
      </div>
      
      <div style={{marginBottom:'10px',padding:'10px',border:'1px solid #000'}}>
        <h4>设置每张彩票需要的eth数量，当前值= {unitPrice} ETH</h4>
        <input type="text" value={inputPrice} onChange={(e)=>setInputPrice(NumberCheck(e.target.value))} placeholder="请输入彩票单价"/>
        <button onClick={toSetUnitPrice} style={{marginLeft:'20px'}}>设置每张彩票价格</button>
        <h4>设置大奖与小奖</h4>
          <input value={inputBigPrize} onChange={(e)=>setInputBigPrize(NumberCheck(e.target.value))} type="text" placeholder='匹配四个数奖金金额'  />
          <input value={inputSmallPrize} onChange={(e)=>setInputSmallPrize(NumberCheck(e.target.value))} type="text" placeholder='匹配三个数奖金金额' style={{marginLeft:'20px'}} />
        <button onClick={setPrize} style={{marginLeft:'20px'}}>设置奖金</button>
        <button onClick={getPrize} style={{marginLeft:'20px'}}>查看奖金</button>
        <span>大奖奖金:{bigPrize} &nbsp;&nbsp;&nbsp;</span>
        <span>小奖奖金:{smallPrize} &nbsp;&nbsp;&nbsp;</span>
        <br/><br/>
        <span style={{color:"red"}}>当前期:  第{openNumberList.length}期 &nbsp;&nbsp;&nbsp;</span><button onClick={draw}>开奖</button>
      </div>

      <h2>用户购买页面</h2>
      <div style={{marginBottom:'10px',padding:'10px',border:'1px solid #000'}}> 
        <span>用户账户余额:{userBalance} ETH</span><span>&nbsp;&nbsp;&nbsp;合约账户余额:{contractBalance} ETH</span>
        <br/>
        <input type="text" placeholder='请输入你的购买号码' value={number} onChange={(e)=>setNumber(e.target.value.replace(/\D/g, ''))} maxLength={4}/>
        <input type="text" placeholder='请输入你的购买数量' value={quantity} onChange={(e)=>setQuantity(e.target.value.replace(/\D/g, ''))} style={{marginLeft:'20px'}} />
        <button onClick={play} style={{marginLeft:'20px'}}>购买</button>
        <br/><br/>
        <div>
          <input type="text" value={selectedPeriod} onChange={(e)=>setSelectedPeriod(e.target.value)} placeholder='选择期数' />
          <button onClick={(e:any)=>getTickets(Number(selectedPeriod as string))} style={{marginLeft:'20px'}}>查看已购彩票</button>
        </div>
        {
          selectedTickets.map((item:any,i:number) =>(
            <div key={i}>
              <span>期数:{item.period} &nbsp;&nbsp;&nbsp;</span>
              <span>号码:{item.number} &nbsp;&nbsp;&nbsp;</span>
              <span>数量:{item.quantity} &nbsp;&nbsp;&nbsp;</span>
              <span>{item.exchangeStatus==false?"未兑奖":"已兑奖,"+(item.winStatus==0?"未中奖":(item.winStatus==1?"中大奖":"中小奖"))}</span>
            </div>
          ))
        }
        </div>
      <div style={{marginBottom:'10px',padding:'10px',border:'1px solid #000'}}>
        <h4>开奖信息</h4>
        {
          openNumberList.map((item:any,i:number) =>(
            <p key={i} style={{color:"blue"}}>第{i}期&nbsp;&nbsp;&nbsp;开奖号码: {item}</p>
          ))
        }
      </div>
     
      <div style={{marginBottom:'10px',padding:'10px',border:'1px solid #000'}}>
        <h4>兑奖</h4>
        <div>
          <input type="text" placeholder='请输入你的兑奖号码' value={inputExchangeNumber} onChange={(e)=>setInputExchangeNumber(e.target.value.replace(/\D/g, ''))} maxLength={4}/>
          <input type="text" placeholder='请输入你的兑奖期数' value={inputExchangePeriod} onChange={(e)=>setInputExchangePeriod(e.target.value.replace(/\D/g, ''))} style={{marginLeft:'20px'}}/>
        <button onClick={exchange} style={{marginLeft:'20px'}}>兑奖</button>
        </div>
      </div>

      <div>
        <p>测试用，便于开奖后购买开奖号码</p>
        <input type="text" value={numberTemp} onChange={(e)=>setNumberTemp(e.target.value.replace(/\D/g, ''))} placeholder='号码' maxLength={4}/>
        <input type="text" value={periodTemp} onChange={(e)=>setPeriodTemp(e.target.value)} placeholder='期数' style={{marginLeft:'20px'}}/>
        <button onClick={setTicketTemp} style={{marginLeft:'20px'}}>购买彩票</button>
      </div>
    </div>
  );
}

export default App;
