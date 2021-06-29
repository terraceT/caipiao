// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import '@openzeppelin/contracts/access/Ownable.sol';

contract Data is Ownable{
    uint256 public bigPrize;//大奖奖金
    uint256 public smallPrize;//小奖奖金
    uint256 public unitPrice;  //彩票单价
    uint256[] public openNumberList; //所有期开奖号码列表

    struct lotteryInfo {
        address owner; //拥有者
        uint period; //期数
        uint number; //彩票号码
        uint quantity; //数量
        bytes32 id; //机选时随机数结果
        bool exchangeStatus; //兑奖状态  true：已兑奖   false: 未兑奖
        uint winStatus; //中奖状态  0：未中奖   1:  中大奖   2:  中小奖
    }

    mapping(address => mapping(uint =>lotteryInfo[])) ownerTickets; //address : 用户地址    mapping里的unit：第几期    lotteryInfo[]：用户购买号码信息数组，每个号码对应一个loteryInfo结构

    constructor() {
        unitPrice = 0.01 ether;
        bigPrize = 0.1 ether;
        smallPrize = 0.05 ether;
    }
    
    //设置奖金        _bigPrize：大奖奖金       _smallPrize：小奖奖金
    function setPrize(uint256 _bigPrize,uint256 _smallPrize) public onlyOwner{
        bigPrize = _bigPrize;
        smallPrize = _smallPrize;
    }

    //返回大奖奖金：号码全匹配
    function getBigPrize() public view returns(uint256) {
        return bigPrize;
    }

     //返回小奖奖金：号码部分匹配
    function getSmallPrize() public view returns(uint256) {
        return smallPrize;
    }

    //设置彩票单价
    function setUnitPrice(uint256 _unitPrice) public onlyOwner{
        unitPrice = _unitPrice;
    }

    //返回彩票单价
    function getUnitPrice() public view returns(uint256) {
        return unitPrice;
    }

    //返回所有期开奖号码列表
    function getOpenNumberList() public view  returns(uint256[] memory) {
        return openNumberList;
    }

    //返回已开奖总期数
    function getOpenNumberListLength() public view returns(uint256) {
        return openNumberList.length;
    }
    
    //保存开奖号码
    function pushOpenNumberList(uint256 number) public onlyOwner {
        openNumberList.push(number);
    }

    //返回用户该期购买的彩票号码     owner：用户地址    period：彩票期数   
    function getSelectedTickets(address owner,uint256 period) view public returns(lotteryInfo[] memory){
        return ownerTickets[owner][period];
    }

    //保存用户购买彩票信息：机选1注
    function pushTickets(address owner,uint256 number,bytes32 id) public {
        uint256 period=getPeriod();
        pushTickets(owner, period, number, 1, id);
    }

    //保存用户购买彩票信息：人选     number：选中号码     owner：用户地址       quantity：注数
    function pushTickets(address owner,uint256 number,uint256 quantity,bytes32 id) public {
        uint256 period=getPeriod();
        pushTickets(owner, period, number, quantity, id);
    }

    function pushTickets(address owner,uint256 period,uint256 number,uint256 quantity,bytes32 id) public {
        ownerTickets[owner][period].push(lotteryInfo(owner,period,number,quantity,id,false,0));
    }

    function getPeriod() view public returns(uint256) {
         return openNumberList.length;
     }

    //置兑奖状态
    function setExchangeStatus(address owner,uint256 period,uint256 index,bool status) public {
        ownerTickets[owner][period][index].exchangeStatus=status;
    }

    //置中奖状态winStatus    0：未中奖    1：中大奖      2：中小奖
    function setWinStatus(address owner,uint256 period,uint256 index,uint winStatus) public {
        ownerTickets[owner][period][index].winStatus=winStatus;
    }
}