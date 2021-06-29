const Lottery = artifacts.require("Lottery");
module.exports = function (deployer) {
  deployer.deploy(Lottery,"0xD80f188B7F1E214765D2b231a64bB577D6CB6983");
};
