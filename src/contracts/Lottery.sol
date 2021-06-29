// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import '@openzeppelin/contracts/access/Ownable.sol';
import './Data.sol';

contract Lottery is Ownable{
    Data data;//数据合约
    bool public pauseStatus;//合约暂停状态

    //购买事件      owner：兑奖人地址    number：指定号码     quantity：数量    id：随机号码(机选时用)
    event GetPlay(address owner,uint256 number,uint256 qDuantity,bytes32 id);
    //开奖事件     number：开奖号码
    event GetDraw(uint256 number);
    //兑奖事件     owner：兑奖人地址    number：兑奖号码     quantity:  注数    prize：总奖金
    event GetExchange(address owner,uint256 number, uint quantity,uint256 prize);

    constructor (address dataContractAddress) {    //参数是依据src\migrations\3_lottery.js
        pauseStatus= false; //合约正常运行状态
        data = Data(dataContractAddress);
        //data.transferOwnership(address(this));//将数据合约的所有权转移到彩票合约
    }

    //将data合约的所有权转给消息发送者
    function transferOwnership() public onlyOwner {
        data.transferOwnership(msg.sender);
    }

    //合约的总余额
    function getbalance() public view returns(uint256) {
        return address(this).balance;
    }

    //修饰器，校验状态
    modifier needPause() {
        require(!pauseStatus,'the contract is paused!');
        _;
    }

    //设置状态
    function setPaused(bool _pauseStatus) public onlyOwner {
        pauseStatus = _pauseStatus;
    }

    //设置彩票单价
    function setUnitPrice(uint256 unitPrice) public onlyOwner{
        data.setUnitPrice(unitPrice);
    }

    //返回彩票单价
    function getUnitPrice() public view returns(uint256) {
        return data.getUnitPrice();
    }

    //设置奖金        bigPrize：大奖奖金       smallPrize：小奖奖金
    function setPrize(uint256 bigPrize,uint256 smallPrize) public onlyOwner {
        data.setPrize(bigPrize, smallPrize);
    }

    //返回大奖金额
    function getBigPrize() public view returns(uint256){
        return data.getBigPrize();
    }

    //返回小奖金额
    function getSmallPrize() public view returns(uint256){
        return data.getSmallPrize();
    }
    
    //返回用户该期数购买的彩票号码     period：彩票期数
    function getSelectedTickets(uint period) view public returns(Data.lotteryInfo[] memory){
        return data.getSelectedTickets(msg.sender,period);
    }

    //返回开奖号码列表
    function getOpenNumberList() view public returns(uint256[] memory){
        uint256[] memory openNumberList = data.getOpenNumberList();
        return openNumberList;
    }

    //购买彩票：机选
    function playRandom(uint256 quantity) public payable needPause {
        uint unitPrice = data.getUnitPrice();
        require(msg.value == unitPrice * quantity,'value is not correct');
        for (uint256 index = 0; index < quantity; index++) { 
            bytes memory b1 = abi.encodePacked(block.timestamp,block.difficulty,msg.sender); //紧密打包编码
            bytes32 b2 = keccak256(b1); //Keccak256哈希算法(SHA3的变种)做哈希
            uint256 number = uint256(b2) % 10000; //取4位数
            data.pushTickets(msg.sender,number,b2); //保存用户购买彩票信息：机选1注
            emit GetPlay(msg.sender,number,1,b2); //记录购买事件
        }
    }

    //购买彩票：人选      number：人选号码     quantity：注数
    function play(uint256 number,uint256 quantity) public payable returns(uint256){
        uint unitPrice = data.getUnitPrice();
        require(msg.value == unitPrice * quantity,'value is not correct');
        data.pushTickets(msg.sender,number,quantity,0); //保存用户购买彩票信息：人选quantity注number
        emit GetPlay(msg.sender,number,quantity,0); //记录购买事件
        return number; //返回人选号码
    }
    
    //开奖
    function draw() public onlyOwner needPause {  //先检查状态，暂停状态下不能开奖
        bytes memory b1 = abi.encodePacked(block.timestamp,block.difficulty,msg.sender); //紧密打包编码
        bytes32 b2 = keccak256(b1); //Keccak256哈希算法(SHA3的变种)做哈希
        uint256 number = uint256(b2) % 10000; //取4位数
        data.pushOpenNumberList(number); //保存开奖号码
        emit GetDraw(number); //记录开奖事件
    }

    //兑奖    number：兑奖号码     period：彩票期数
    function exchange(uint256 number,uint256 period) public needPause returns(uint256){  //先检查状态，暂停状态下不能兑奖
        uint256[] memory tempList = data.getOpenNumberList(); //开奖号码列表
        uint256 openNumber = tempList[period]; //period期的开奖号码
        uint256 bigPrize = data.getBigPrize(); //大奖金额
        uint256 smallPrize = data.getSmallPrize(); //小奖金额
        uint256 totalPrize = 0;
        Data.lotteryInfo[] memory tempInfos = data.getSelectedTickets(msg.sender,period); //用户购买的period期彩票
        for (uint256 index = 0; index < tempInfos.length; index++) {  //遍历用户购买的彩票号码
            uint256 ownerNumber = tempInfos[index].number;
            if(ownerNumber == number){    //用户购买了兑奖号码
                if(tempInfos[index].exchangeStatus) //如果已经兑过奖，则跳过
                        continue;
                data.setExchangeStatus(msg.sender,period,index,true); //置兑奖状态为已兑奖
                if(number == openNumber){   //兑奖号码中大奖：全部匹配
                    uint256 prize = bigPrize * tempInfos[index].quantity;
                    payable(msg.sender).transfer(prize); //派奖
                    data.setWinStatus(msg.sender,period,index,1); //置中奖状态为中大奖
                    totalPrize += prize;
                    emit GetExchange(msg.sender,number,tempInfos[index].quantity,prize); //记录兑奖事件
                } else if((openNumber % 1000 == ownerNumber % 1000)  //开奖号码的低3位数匹配用户彩票的低3位数
                          || (openNumber % 1000 == ownerNumber / 10)       //开奖号码的低3位数匹配用户彩票的高3位数
                          || (openNumber / 10 == ownerNumber % 1000)       //开奖号码的高3位数匹配用户彩票的低3位数
                          || (openNumber / 10 == ownerNumber / 10)){          //开奖号码的高3位数匹配用户彩票的高3位数
                    uint256 prize = smallPrize * tempInfos[index].quantity;
                    payable(msg.sender).transfer(prize); //派奖
                    data.setWinStatus(msg.sender,period,index,2); //置中奖状态为中小奖
                    totalPrize += prize;
                    emit GetExchange(msg.sender,number,tempInfos[index].quantity,prize); //记录兑奖事件
                }
                else
                {
                    data.setWinStatus(msg.sender,period,index,0); //置中奖状态为未中奖
                }
            }
        }

        return totalPrize;
    }

    //方便测试用，开奖后通过它仍可以继续购买指定期数的彩票
    function setTicketTemp(uint256 period,uint256 number) public onlyOwner{
        data.pushTickets(msg.sender, period, number, 1, 0);
    }

    receive() external payable {}

}