pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/token/ERC20/MintableToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/PausableToken.sol";

contract IPToken is MintableToken, PausableToken {
    string public constant name = "IP Credit";
    string public constant symbol = "IPC";
    uint8 public constant decimals = 18;
}
