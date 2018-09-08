pragma solidity ^0.4.24;

import "@daostack/arc/contracts/universalSchemes/UniversalScheme.sol";
import "@daostack/arc/contracts/universalSchemes/ExecutableInterface.sol";
import "@daostack/arc/contracts/VotingMachines/IntVoteInterface.sol";
import "@daostack/arc/contracts/controller/ControllerInterface.sol";

contract Hackfury is UniversalScheme, ExecutableInterface {


  mapping (bytes32 => Parameters) public parameters;
  mapping (address => string) public auditors;
  mapping (uint => uint) public etherLockedByReport;
  mapping (uint => address[]) public blamedHack;
	mapping (address => uint) public reputationGotByTips;

  Report[] public reports;

	struct Parameters {
		bytes32 voteApproveParams;
		IntVoteInterface intVote;
	}

  struct Report {
    address auditor;
    address customer;
    uint date;
    string linkToReport;
    string codeVersionAudited;
    string reportHashsum;
    bool summary;
    bool approvedByCustomer;
  }

  event AuditorRegistered(address _auditor, string _name);
  event ReportSubmitted(uint _reportId, address _auditor, address _customer, uint _date, string _linkToReport, string _codeVersionAudited, string _reportHashsum, bool _summary);
  event EtherLockedInReport(uint _reportId, address _auditor, uint _etherAmount);
  event ReportConfirmed(uint _reportId, address _customer);
  event HackBlamed(uint _reportId, address _trustedAuditor);
  event HackConfirmed(uint _reportId, address _customer, uint _etherAmount);
  event AuditValidated(uint _reportId, address _auditor, uint _etherAmount);
  event AuditorTipped(address _trustedAuditor, address _auditor);

  constructor() public {

    auditors[0xc73b23be8CD2a99c2b5A35D190C8684c87fAfa04] = "Ivan";
    auditors[0x2b02EA775ffAF5f45FE97Fb938FFAea8756eF076] = "Paul";
    auditors[0xd2BDfc2d407b6EEB949a44192bBbf874cD392a11] = "Test";


  }

  function registerAsAuditor(string _name) public {

    auditors[msg.sender] = _name;
    emit AuditorRegistered(msg.sender, _name);

  }

  function submitReport(address _customer, string _linkToReport, string _codeVersionAudited, string _reportHashsum, bool _summary)
  	public payable returns(uint) {

      require(keccak256(auditors[msg.sender]) != keccak256(""));
      require(msg.value > 1 finney);
      reports.push(Report(msg.sender, _customer, now, _linkToReport, _codeVersionAudited, _reportHashsum, _summary, false));
      emit ReportSubmitted(reports.length, msg.sender, _customer, now, _linkToReport, _codeVersionAudited, _reportHashsum, _summary);
      etherLockedByReport[reports.length] = msg.value;
      emit EtherLockedInReport(reports.length, msg.sender, msg.value);

			return reports.length;

  }

  function confirmReport(uint _id) public {

		require(msg.sender == reports[_id].customer);
    reports[_id].approvedByCustomer = true;
    emit ReportConfirmed(_id, msg.sender);

  }

  function blameHack(address _avatar, uint _id) public {

    require(ControllerInterface(Avatar(_avatar).owner()).getNativeReputation(msg.sender) >= 100);

		blamedHack[_id].push(msg.sender);
    emit HackBlamed(_id, msg.sender);

	  if (blamedHack[_id].length == 5) {
      uint tempEtherLockedByReport = etherLockedByReport[_id];
      etherLockedByReport[_id] = 0;
      reports[_id].customer.transfer(tempEtherLockedByReport);
      emit HackConfirmed(_id, reports[_id].customer, tempEtherLockedByReport);
			bool auditorReputationOK = ControllerInterface(Avatar(_avatar).owner()).getNativeReputation(reports[_id].auditor) > 42;
			// ControllerInterface(Avatar(_avatar).owner()).getNativeReputation(_avatar).reputationOf(msg.sender) >= 42
			// this should work
		if ( auditorReputationOK ) {
		    ControllerInterface(Avatar(_avatar).owner()).burnReputation(42, reports[_id].auditor, _avatar);
			} else {
		    ControllerInterface(Avatar(_avatar).owner()).burnReputation(uint256(ControllerInterface(Avatar(_avatar).owner()).getNativeReputation(reports[_id].auditor)), reports[_id].auditor, _avatar);
	    }

      }

    }

  function claimEnd(address _avatar, uint _id) public {

    require(blamedHack[_id].length < 6);
    require(now > reports[_id].date + 5 * 60);
    require(etherLockedByReport[_id] != 0);

    uint tempEtherLockedByReport = etherLockedByReport[_id];
    etherLockedByReport[_id] = 0;
		ControllerInterface(Avatar(_avatar).owner()).mintReputation(3, reports[_id].auditor, _avatar);
    reports[_id].auditor.transfer(tempEtherLockedByReport);
    emit AuditValidated(_id, reports[_id].auditor, tempEtherLockedByReport);

  }

	function tipAuditorWithReputation(address _avatar, address _auditor, uint _reputation) public {
		require(keccak256(auditors[_auditor]) != keccak256(""));
		require(reputationGotByTips[_auditor] + _reputation < 6);
		// require(ControllerInterface(Avatar(_avatar).owner()).getNativeReputation(msg.sender) >= 100);
    // require(ControllerInterface(Avatar(_avatar).owner()).getNativeReputation(_avatar).reputationOf(msg.sender) >= 100);
		// this should work
		reputationGotByTips[_auditor] = reputationGotByTips[_auditor] + _reputation;
		ControllerInterface(Avatar(_avatar).owner()).mintReputation(_reputation * 10 ** 18, _auditor, _avatar);

	}

	function setParameters(
		bytes32 _voteApproveParams,
		IntVoteInterface _intVote
	) public returns(bytes32)
	{

		bytes32 paramsHash = getParametersHash(
	  	_voteApproveParams,
			_intVote
		);
		parameters[paramsHash].voteApproveParams = _voteApproveParams;
		parameters[paramsHash].intVote = _intVote;
		return paramsHash;

	}

	function getParametersHash(
		bytes32 _voteApproveParams,
		IntVoteInterface _intVote
	) public pure returns(bytes32)
	{

		return (keccak256(abi.encodePacked(_voteApproveParams, _intVote)));

	}

	function execute(bytes32 _proposalId, address _avatar, int _param) public returns(bool) {

		require(
			parameters[getParametersFromController(Avatar(_avatar))].intVote == msg.sender,
			"Only the voting machine can execute proposal"
		);

		return true;

	}

}
