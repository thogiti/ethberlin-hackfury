import {
  InitializeArcJs,
  LoggingService,
  LogLevel,
  DAO,
  ConfigService,
  AccountService,
  WrapperService,
  BinaryVoteResult
} from "@daostack/arc.js";

// Import the JSON file of our PeepScheme
const hackfurySchemeArtifacts = require("../build/contracts/Hackfury.json");
// Import truffle-contract, which we use to interact with non-ArcJS contracts
const contract = require("truffle-contract");

// Initializes the PeepScheme as a contract
// This is not a specific instance but the contract object which can be later initialized
let HackfuryScheme = contract(hackfurySchemeArtifacts);

// Default Avatar and Voting Machine addresses when using Ganache cli.
// TODO: Paste here your own instances addresses which can be found in the logs at the end of the migration script.
const avatarAddress = "0x1dd9ad7f0d28aca9cc4cd1fecc44acf7c5bf5075";
const votingMachineAddress = "0x7cab5dfaa0a3cf483668603ca960a66c75ebeb8e";

var hackfuryDAO;
var hackfuryScheme;
var votingMachine;
var userRep;
var totalRep;

async function initialize() {
  // Initialize the ArcJS library
  ConfigService.set("estimateGas", true);
  ConfigService.set("txDepthRequiredForConfirmation.kovan", 0);

  // TODO: If you use Kovan uncomment this line
  ConfigService.set("network", "kovan"); // Set the network used to Kovan

  await InitializeArcJs({
    watchForAccountChanges: true,
    filter: {
      // If you want to use only specific Arc contracts list them here
      AbsoluteVote: true,
      DaoCreator: true,
      ControllerCreator: true,
      Avatar: true,
      Controller: true
    }
  });

  LoggingService.logLevel = LogLevel.all; // Remove or modify to change ArcJS logging

  AccountService.subscribeToAccountChanges(() => {
    window.location.reload();
  });
}

async function go() {
  hackfuryDAO = await DAO.at(avatarAddress);

  const daoSchemes = await hackfuryDAO.getSchemes(); // Returns all the schemes your DAO is registered to
  const hackfurySchemeAddress = daoSchemes[0].address; // Since our DAO has only 1 scheme it will be the first one

  HackfuryScheme.setProvider(web3.currentProvider); // Sets the Web3 Provider for a non-ArcJS contract
  hackfuryScheme = await HackfuryScheme.at(hackfurySchemeAddress); // Initializes a PeepScheme instance with our deployed scheme address

  // Using ArcJS to initializes our Absolute Vote contract instance with the deployed contract address
  votingMachine = await WrapperService.factories.AbsoluteVote.at(votingMachineAddress);

  // Gets the user reputation and the total reputation supply
  var userAccount = web3.eth.accounts[0];
  userRep = await getUserReputation(userAccount);
  totalRep = web3.fromWei(await hackfuryDAO.reputation.getTotalSupply());

  // setup frontend
  if (userRep == 0) {
    $("#registration").css("display", "block")
    $("#newAuditorButton").click(registerAuditor);
  }
  else {
    $("#registration").css("display", "none")

    $("#account").css("display", "block")
    
    $("#newAuditReport").click(submitReport)
    $("#auditorTip").click(auditorTip)
    $("#customerSign").click(customerSign)
    $("#auditorClaim").click(auditorClaim)
    $("#displayAccountReputation").click(displayAccountReputation)
  }
}

// function getPeepProposalsList() {
//   // clear the existing list
//   $("#peepProposalList li").remove();

//   // Get all new proposal events filtered by our Avatar
//   const eventFetcher = peepScheme.NewPeepProposal(
//     { _avatar: avatarAddress },
//     { fromBlock: 0, toBlock: "latest" }
//   );

//   eventFetcher.get(function(error, events) {
//     events.reverse().forEach(event => {
//       // Get the id of the created proposal
//       var proposalId = event.args._proposalId;

//       // If the proposal is still voteable (wasn't approved or declined yet)
//       votingMachine
//         .isVotable({ proposalId: proposalId })
//         .then(function(isVotable) {
//           if (isVotable) {
//             // Gets the current votes for the proposals
//             votingMachine
//               .getCurrentVoteStatus(proposalId)
//               .then(function(votes) {
//                 // Get the hash of the Peep content saved on IPFS
//                 var peepHash = event.args._peepHash;
//                 // Get the content of the peep from IPFS
//                 getPeepContentFromHash(peepHash).then(function(peepContent) {
//                   // Add the peep to the proposals list
//                   addPeepToList(proposalId, peepContent, votes);
//                 });
//               });
//           }
//         });
//     });
//   });
// }

// function addPeepToList(proposalId, peepContent, votes) {
//   // The votes on a Peep should be:
//   // 0 - Abstain
//   // 1 - Yes
//   // 2 - No
//   var peepUpvotes = web3.fromWei(votes[1]);
//   var peepDownvotes = web3.fromWei(votes[2]);

//   // Displays the Peep data in an HTML list item
//   var listItem =
//     '<li id="' +
//     proposalId +
//     '">' +
//     '<span class="peepProposalText" style="margin-right:25px;">' +
//     peepContent +
//     "</span>" +
//     "<input " +
//     (userRep > 0 ? "" : "disabled ") +
//     'type="button" value="+" class="upvotePeep" style="font-size : 30px; text-align: center;" />' +
//     '<span class="upvotesCount" style="margin-right:5px;">' +
//     (peepUpvotes / totalRep) * 100 +
//     "%</span>" +
//     "<input " +
//     (userRep > 0 ? "" : "disabled ") +
//     'type="button" value="-" class="downvotePeep" style="font-size : 30px; text-align: center;" />' +
//     '<span class="downvotesCount" style="margin-right:5px;">' +
//     (peepDownvotes / totalRep) * 100 +
//     "%</span>" +
//     "</li>";
//   $("#peepProposalList").append(listItem);

//   $("#" + proposalId + " .upvotePeep").click(function() {
//     upvotePeep(proposalId);
//   });
//   $("#" + proposalId + " .downvotePeep").click(function() {
//     downvotePeep(proposalId);
//   });
// }

// function upvotePeep(proposalId) {
//   // Votes in favor of a proposal using the Absolute Voting Machine
//   votingMachine
//     .vote({ proposalId: proposalId, vote: BinaryVoteResult.Yes })
//     .then(getPeepProposalsList);
// }

// function downvotePeep(proposalId) {
//   // Votes against a proposal using the Absolute Voting Machine
//   votingMachine
//     .vote({ proposalId: proposalId, vote: BinaryVoteResult.No })
//     .then(getPeepProposalsList());
// }

async function getUserReputation(account) {
  // Gets a list of the DAO participants with their reputation
  // Here we filter the list to get only the user account
  var participants = await hackfuryDAO.getParticipants({
    participantAddress: account,
    returnReputations: true
  });

  // If the user is part of the DAO return its reputation
  if (participants.length > 0) {
    return web3.fromWei(participants[0].reputation);
  }

  // If the user has no reputation in the DAO return 0
  return 0;
}

function registerAuditor() {
  // Get the proposal content and clears the text from the UI
  var auditorName = $("#newAuditorName").val();
  $("#newAuditorName").val("");

  var newProposalTx = hackfuryScheme.registerAsAuditor(auditorName, {
      gas: 300000 // Gas used by the transaction (including some safe margin)
    })
    .then(function(result) {
      // Reload the proposals list
      // Please note that on non-local networks this would be updated faster than the transaction will be included in a block
      // To see changes there you'll need to add logic to wait for confirmation or manually refresh the page when the transaction is included
      
      // code to setup reloader
      console.log(result);
      $("#registration").css("display", "none")

      $("#account").css("display", "block")
      $("#userInfo").css("display", "block")

      $("#newAuditReport").click(submitReport)
      $("#auditorTip").click(auditorTip)
      $("#customerSign").click(customerSign)

      console.log(hackfuryScheme.auditors)
    })
    .catch(console.log);
  }

function submitReport() {
  var customerAddress = web3.toBigNumber($("#customerAddress").val());
  var reportURL = $("#reportURL").val();
  var codeVersion = $("#codeVersion").val();
  var reportHashsum = $("#reportHashsum").val();
  var auditPassed = false;
  $("#customerAddress").val("");
  $("#reportURL").val("");
  $("#codeVersion").val("");
  $("#reportHashsum").val("");

  var amountToStake = web3.toWei(0.001001, "ether");
  console.log("Trying to send", amountToStake, "wei");
  var newProposalTx = hackfuryScheme.submitReport(customerAddress, reportURL, codeVersion, reportHashsum, auditPassed, {
      gas: 300000,
      value: amountToStake
    })
    .then(function(result) {
      console.log(result);
    })
    .catch(console.log);
}

function auditorTip() {
  var auditorAddress = web3.toBigNumber($("#auditorAddress").val());
  var tipAmount = parseInt($("#tipAmount").val());
  console.log("Trying to tip", tipAmount, "reputation");
  var newProposalTx = hackfuryScheme.tipAuditorWithReputation(avatarAddress, auditorAddress, tipAmount, {
      gas: 300000
    })
    .then(function(result) {
      console.log(result);
    })
    .catch(console.log);
}

function customerSign() {
  var reportId = parseInt($("#reportSignId").val());
  console.log("Trying to sign report id = ", reportId);
  var newProposalTx = hackfuryScheme.confirmReport(reportId, {
      gas: 300000
    })
    .then(function(result) {
      console.log(result);
    })
    .catch(console.log);
}

function auditorClaim() {
  var reportId = parseInt($("#reportClaimId").val());
  console.log("Trying to get ETH from report id = ", reportId);
  var newProposalTx = hackfuryScheme.claimEnd(web3.toBigNumber(avatarAddress), reportId, {
      gas: 300000
    })
    .then(function(result) {
      console.log(result);
    })
    .catch(console.log);
}

function displayAccountReputation() {
  var accountAddress = web3.toBigNumber($("#accountAddress").val());
  var foo = hackfuryScheme.getReputationByAddress(web3.toBigNumber(avatarAddress), accountAddress, {
    gas: 300000
  })
  .then(function(result) {
    $("#accountReputation").text(result["c"][0] / 10000)
  })
  .catch(console.log);
}



// Call our initialize method when the window is loaded
$(window).on("load", function() {
  initialize();
  go();
});
