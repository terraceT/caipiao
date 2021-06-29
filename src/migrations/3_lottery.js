const Lottery = artifacts.require("Lottery");
module.exports = function (deployer) {
  deployer.deploy(Lottery,"0xE8bF4EEB1aa38e963e26aB4dbaDDC49D8e6Dfe4C");
};