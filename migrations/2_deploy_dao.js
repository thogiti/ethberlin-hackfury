var Avatar = artifacts.require("@daostack/arc/Avatar.sol");
var Controller = artifacts.require("@daostack/arc/Controller.sol");
var DaoCreator = artifacts.require("@daostack/arc/DaoCreator.sol");
var ControllerCreator = artifacts.require("@daostack/arc/ControllerCreator.sol");
var AbsoluteVote = artifacts.require("@daostack/arc/AbsoluteVote.sol");
var HackfuryScheme = artifacts.require("./Hackfury.sol");

const GAS_LIMIT = 5900000;

// Organization parameters:
const orgName = "Hackfury DAO";
const tokenName = "Hackfury DAO Token";
const tokenSymbol = "HFT";

// The ethereum addresses of the "founders"
var founders = []; //your accounts to give initial reputation to

var foundersTokens; // the token amount per founder account
// TODO: list the reputation amount per founder account
var foundersRep;

const votePrec = 50; // The quorum (percentage) needed to pass a vote in the voting machine

var AvatarInst;
// var AbsoluteVoteInst;
var hackfurySchemeInstance;

module.exports = async function(deployer) {
  // TODO: edit this switch command based on the comments at the variables decleration lines
  switch (deployer.network) {
    case "development":
      founders = [web3.eth.accounts[0]];
      foundersTokens = [web3.toWei(0)];
      foundersRep = [web3.toWei(10)];
      break;
    case "kovan-infura":
      founders = [
        "0xc73b23be8cd2a99c2b5a35d190c8684c87fafa04", 
        "0x2b02EA775ffAF5f45FE97Fb938FFAea8756eF076",
        "0xd2bdfc2d407b6eeb949a44192bbbf874cd392a11",
      ]; // TODO: Replace with your own address
      foundersTokens = [web3.toWei(1), web3.toWei(2), web3.toWei(3)];
      foundersRep = [web3.toWei(101), web3.toWei(100), web3.toWei(99)];
      break;
  }

  deployer
    .deploy(ControllerCreator, { gas: GAS_LIMIT })
    .then(async function() {
      var controllerCreator = await ControllerCreator.deployed();
      await deployer.deploy(DaoCreator, controllerCreator.address);
      var daoCreatorInst = await DaoCreator.deployed(controllerCreator.address);
      // Create DAO:
      var returnedParams = await daoCreatorInst.forgeOrg(
        orgName,
        tokenName,
        tokenSymbol,
        founders,
        foundersTokens, // Founders token amounts
        foundersRep, // FFounders initial reputation
        0, // 0 because we don't use a UController
        0, // no token cap
        { gas: GAS_LIMIT }
      );
      AvatarInst = await Avatar.at(returnedParams.logs[0].args._avatar); // Gets the Avatar address
      var ControllerInst = await Controller.at(await AvatarInst.owner()); // Gets the controller address
      var reputationAddress = await ControllerInst.nativeReputation(); // Gets the reputation contract address

      // Deploy AbsoluteVote Voting Machine:
      await deployer.deploy(AbsoluteVote);
      AbsoluteVoteInst = await AbsoluteVote.deployed();
      // Set the voting parameters for the Absolute Vote Voting Machine
      await AbsoluteVoteInst.setParameters(reputationAddress, votePrec, true);
      // Voting parameters and schemes params:
      var voteParametersHash = await AbsoluteVoteInst.getParametersHash(
        reputationAddress,
        votePrec,
        true
      );

      // Set the peepeth contract address to use
      // var hackfuryAddress = "0x0000000000000000000000000000000000000000";

      // switch (deployer.network) {
      //   case "development":
      //     // await deployer.deploy(Peepeth);
      //     // peepethInstance = await Peepeth.deployed();
      //     // peepethAddress = peepethInstance.address;
      //     console.log("will do all the development on the kovan nwrk")
      //     break;
      //   case "kovan-infura":
      //     hackfuryAddress = "0xb704a46B605277c718A68D30Cb731c8818217eC7";
      //     break;
      // }

      // Deploy the Scheme
      await deployer.deploy(HackfuryScheme);
      hackfurySchemeInstance = await HackfuryScheme.deployed();

      // Set the scheme parameters
      await hackfurySchemeInstance.setParameters(
        voteParametersHash,
        AbsoluteVoteInst.address
      );

      var hackfuryParamsHash = await hackfurySchemeInstance.getParametersHash(
        voteParametersHash,
        AbsoluteVoteInst.address
      );

      var schemesArray = [hackfurySchemeInstance.address]; // The address of the scheme
      const paramsArray = [hackfuryParamsHash]; // Defines which parameters should be grannted in the scheme
      const permissionArray = ["0x00000010"]; // Granting full permissions to the Peep Scheme

      // set the DAO's initial schmes:
      await daoCreatorInst.setSchemes(
        AvatarInst.address,
        schemesArray,
        paramsArray,
        permissionArray
      ); // Sets the scheme in our DAO controller by using the DAO Creator we used to forge our DAO

      console.log("Your DAO was deployed successfuly!");
      console.log("Avatar address: " + AvatarInst.address);
      console.log("Absolute Voting Machine address: " + AbsoluteVoteInst.address);
    });

};
