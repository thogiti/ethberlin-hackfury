pragma solidity ^0.4.24;

import "@daostack/arc/contracts/universalSchemes/UniversalScheme.sol";
import "@daostack/arc/contracts/universalSchemes/ExecutableInterface.sol";
import "@daostack/arc/contracts/VotingMachines/IntVoteInterface.sol";
import "@daostack/arc/contracts/controller/ControllerInterface.sol";

contract Hackfury is UniversalScheme, ExecutableInterface {
	struct Parameters {

        bytes32 voteApproveParams; // The hash of the approved parameters of a Voting Machine for a specific organization.
                                    // Used in the voting machine as the key in the parameters mapping to 
                                    // Note that these settings should be registered in the Voting Machine prior of using this scheme.
                                    // You can see how to register the parameters by looking on `2_deploy_dao.js` under the `migrations` folder at line #64.
        
        IntVoteInterface intVote; // The address of the Voting Machine to be used to propose and vote on a proposal.
    }
    // A mapping from hashes to parameters (use to store a particular configuration on the controller)
    mapping(bytes32 => Parameters) public parameters;

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
        // Check the caller is indeed the voting machine:
        require(
            parameters[getParametersFromController(Avatar(_avatar))].intVote == msg.sender, 
            "Only the voting machine can execute proposal"
        );
        return true;
    }

    //////////////////////////////////////////////////////////////////////
    mapping (address => string) public auditors;
    mapping (uint => uint) public etherLockedByReport;
    mapping (uint => address[]) public blamedHack;

    Report[] public reports;

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

    constructor() public {
        auditors[0xc73b23be8CD2a99c2b5A35D190C8684c87fAfa04] = "Ivan";
        auditors[0x2b02EA775ffAF5f45FE97Fb938FFAea8756eF076] = "Paul";
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
        }
    }

    function claimEnd(uint _id) public {
        require(blamedHack[_id].length < 6);
        require(now > reports[_id].date + 365 * 60 * 60);
        require(etherLockedByReport[_id] != 0);
        uint tempEtherLockedByReport = etherLockedByReport[_id];
        etherLockedByReport[_id] = 0;
        reports[_id].auditor.transfer(tempEtherLockedByReport);
        emit AuditValidated(_id, reports[_id].auditor, tempEtherLockedByReport);
    }

}
