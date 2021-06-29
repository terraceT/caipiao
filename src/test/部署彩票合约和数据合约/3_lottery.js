const Lottery = artifacts.require("Lottery");
const Data = artifacts.require("Data");


module.exports = function (deployer) {
  deployer.deploy(Lottery,Data.address);
};
