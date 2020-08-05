pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract DistributionContract is Ownable {

    ERC20 public IPToken;

    constructor(address _ipTokenContractAddress) public {
        IPToken = ERC20(_ipTokenContractAddress);
    }

    function setIpTokenContractAddress(address _ipTokenContractAddress) onlyOwner public {
        IPToken = ERC20(_ipTokenContractAddress);
    }

    function distributeTokens(address[] _walletsToDistriute, uint[] _amountsToDistribute) public returns (bool success) {
        require(_walletsToDistriute.length <= 100, "Too large array");
        require(_walletsToDistriute.length == _amountsToDistribute.length, "the too arrays are not equal");

        for (uint i = 0; i < _walletsToDistriute.length; i++) {

            IPToken.transferFrom(msg.sender, _walletsToDistriute[i], _amountsToDistribute[i]);
        }

        return true;
    }
}