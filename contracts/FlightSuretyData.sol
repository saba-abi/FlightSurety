// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "hardhat/console.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner; // Account used to deploy contract

    bool private operational = true; // Blocks all state changes throughout the contract if false

    uint public numberOfRegisteredAirlines = 0;

    mapping(address => bool) private authorizedCallers;

    mapping(address => bool) private registeredAirlines;

    mapping(address => uint256) private fundsByAirline;

    struct InsuranceInfo {
        address insuree;
        uint256 amount;
        bool credited;
    }
    mapping(bytes32 => InsuranceInfo[]) private insuranceInfosByFlightKey;
    mapping(address => uint256) private creditsByInsuree;

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/

    /**
     * @dev Constructor
     *      The deploying account becomes contractOwner
     */
    constructor(address firstAirline) {
        contractOwner = msg.sender;
        _registerAirline(firstAirline);
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
     * @dev Modifier that requires the "operational" boolean variable to be "true"
     *      This is used on all state changing functions to pause the contract in
     *      the event there is an issue that needs to be fixed
     */
    modifier requireIsOperational() {
        require(operational, "Contract is currently not operational");
        _; // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
     * @dev Modifier that requires the "ContractOwner" account to be the function caller
     */
    modifier requireContractOwner() {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    modifier requireAuthorized() {
        console.log("requireAuthorized", msg.sender, tx.origin);
        require(authorizedCallers[msg.sender], "Caller is not authorized");
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
     * @dev Get operating status of contract
     *
     * @return A bool that is the current operating status
     */
    function isOperational() public view returns (bool) {
        return operational;
    }

    /**
     * @dev Sets contract operations on/off
     *
     * When operational mode is disabled, all write transactions except for this one will fail
     */
    function setOperatingStatus(bool mode) external requireContractOwner {
        operational = mode;
    }

    function authorizeCaller(address caller) public requireContractOwner {
        console.log("authorizeCaller", caller);
        authorizedCallers[caller] = true;
    }

    function deauthorizeCaller(address caller) public requireContractOwner {
        delete authorizedCallers[caller];
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    /**
     * @dev Add an airline to the registration queue
     *      Can only be called from FlightSuretyApp contract
     *
     */
    function registerAirline(address airline) external requireAuthorized {
        _registerAirline(airline);
    }

    function _registerAirline(address airline) private {
        registeredAirlines[airline] = true;
        numberOfRegisteredAirlines++;
    }

    function isRegisteredAirline(address airline) external view returns (bool) {
        return registeredAirlines[airline];
    }

    /**
     * @dev Buy insurance for a flight
     *
     */
    function buy(
        address airline,
        string memory flight,
        uint256 timestamp
    ) external payable {
        console.log("start buy", airline, flight, timestamp);
        require(msg.value <= 1 ether, "Not allowed to insure more than 1 ETH");
        bytes32 key = getFlightKey(airline, flight, timestamp);
        insuranceInfosByFlightKey[key].push(
            InsuranceInfo({
                insuree: msg.sender,
                amount: msg.value,
                credited: false
            })
        );
        console.log("end buy");
    }

    /**
     *  @dev Credits payouts to insurees
     */
    function creditInsurees(
        address airline,
        string memory flight,
        uint256 timestamp
    ) external requireAuthorized {
        console.log("start creditInsurees", airline, flight, timestamp);
        bytes32 key = getFlightKey(airline, flight, timestamp);
        InsuranceInfo[] memory insurances = insuranceInfosByFlightKey[key];
        console.log("number of insurances", insurances.length);
        for (uint i = 0; i < insurances.length; i++) {
            if (insurances[i].credited) {
                console.log("already credited");
                continue;
            }
            insurances[i].credited = true;
            address insuree = insurances[i].insuree;
            uint256 credit = insurances[i].amount.mul(3).div(2);
            creditsByInsuree[insuree] = credit;
            console.log("credited", insuree, credit);
        }
        console.log("end creditInsurees");
    }

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
     */
    function pay() external {
        require(creditsByInsuree[msg.sender] > 0, "No credits to pay out");
        uint256 credit = creditsByInsuree[msg.sender];
        delete creditsByInsuree[msg.sender];
        payable(msg.sender).transfer(credit);
    }

    /**
     * @dev Initial funding for the insurance. Unless there are too many delayed flights
     *      resulting in insurance payouts, the contract should be self-sustaining
     *
     */
    function fund() public payable {
        fundsByAirline[msg.sender] = msg.value;
    }

    function hasFundedEnough(address airline) external view returns (bool) {
        return fundsByAirline[airline] >= 10 ether;
    }

    function getFlightKey(
        address airline,
        string memory flight,
        uint256 timestamp
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    /**
     * @dev Fallback function for funding smart contract.
     *
     */
    fallback() external payable {
        fund();
    }
}
