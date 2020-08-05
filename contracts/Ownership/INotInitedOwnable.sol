pragma solidity ^0.4.23;


contract INotInitedOwnable {

    event OwnershipTransferred(address indexed _previousOwner, address indexed _newOwner);

    function init() public;
    function transferOwnership(address _newOwner) public;

}