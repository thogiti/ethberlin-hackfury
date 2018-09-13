# The Hackfury DAO

The Hackfury DAO is Decentralized Audit Organization for worldwide audits management build with DAOStack. The DAO stores meta information for all audit reports submitted. It also handles reputation management for auditors.
There are 3 MAJOR problems that Hackfury DAO solves:
1. The arguments between auditor and customer when the audited contract is hacked - both of them can verify necessary information stored in blockchain that can help investigations:
    - Code version audited - confirms what code version was audited
    - The report hash with link to it - proves that auditor and customer haven't changed the report after the incident. It can be stored in private repository and be disclosed only after the incident
    - customer confirmation - the confirmation that the customer accepted the final version of the report
    - binary summary - confirms that the code audited was passing all the security requirements and no issues remained
2. Reputation management for audit companies. DAO stores and manipulates the reputation for all auditor companies. This is transparent rating of auditors - how much reputation they have, how much reputation they earned, why they lost reputation etc.
3. Auditors don't lose anything if they miss. When auditor submits the report to DAO, it locks some ether (for example 20% of audit price) for year. Auditor can claim this ether in a year, if no bugs/hacks were discovered within the period. Theoretically, This ether can be blocked by customer.

## MVP for ETHBerlin Hackathon

We developed MVP for Hackfury DAO with next functions:
1. Register as auditor
2. Submit audit report metadata to blockchain; lock ether for the period in the audit report.
3. Sign the report by customer.
4. Tip the auditor with the reputation
5. Claim the tokens back from the report lock
There are also several trusted auditor accounts predefined with non-zero reputation

You can try the dapp here: http://142.93.132.89:3000/
Or you can ask us to show you))

## The Hackfury Concepts to be done

We consider moving forward with DAOStack extending the functionality for the organization, so DAOStack can help us with:
1. DAO receives audit service requests; distributes them. After DAO receives ether for audit it locks it; 80% of locked ether goes to auditor after customer signs report and 20% in a year, if there were no security incidents with it
2. DAO Reputation model should be reevaluated and extended to have more gain and loss options
3. Auditor report data can be changed before customer signed the report
4. A lot of getters for getting stats about audits, reputation change etc.

## DAO Reputation model

There are N trusted auditors predefined in the Hackfury DAO (they will be community respected auditors Consensys, Quanstamp, Hacken, Trail of bits etc.). These 10 auditors have 100 reputation points at start. Trusted auditors - all auditors that have >=100 reputation points.

All new auditors start with 0 reputation. There are 2 ways to get reputation points:
1. Auditor receive 3 reputation points after they claim tokens - they can claim tokens only if no issues in audited code were found during 1 year
2. Auditor can be tipped with up to 5 reputation points by trusted auditor
Auditors with >= 100 points of reputation become trusted auditors with access to some privileged functions.

Reputation points are reduced only in case when the audited code was hacked or issue in it was discovered - after the issue is confirmed by 35% of trusted auditors, auditor who did the report lose 42 reputation points and ether locked within the report is transferred back to customer.

## DAO functions

- registerAsAuditor - any account can register as auditor with 0 reputation points
- submitReport - auditor publishes report metadata to blockchain
- confirmReport - customer confirms that he received the final report
- blameHack - trusted auditor can blame the report as failed after the hack of code appears
- claimEnd - auditor can claim locked tokens/ether after a year without hacks of the code
- tipAuditorWithReputation - trusted auditors can give some reputation points for addresses they know

Functions that will be programmed in future:
- orderReport - customer can order a report from randomly selected trusted auditor
- changeReportData - auditor can change report metadata before customer signed the report

## Report structure

1. auditor - address of the auditor
2. customer - address of the customer
3. date - date when the audit report was published
4. linkToReport - link to report (can be closed github for private reports)
5. codeVersionAudited - the version of code audited (link to etherscan / link to github, link should contain commit)
6. reportHashsum - hashsum of the report file
7. boolSummary - bool summary of the audit, was it passing or not
8. approvedByCustomer - bool whether customer approved the report

# (c)
Hackfury - we doing hack, we doing fury
