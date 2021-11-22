// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

interface IERC20Token {
  function transfer(address, uint256) external returns (bool);
  function approve(address, uint256) external returns (bool);
  function transferFrom(address, address, uint256) external returns (bool);
  function totalSupply() external view returns (uint256);
  function balanceOf(address) external view returns (uint256);
  function allowance(address, address) external view returns (uint256);

  event Transfer(address indexed from, address indexed to, uint256 value);
  event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract Marketplace {

    uint internal gigsLength = 0;
    address internal cUsdTokenAddress = 0x069fdfecbf3275aabCd886450270D8B4241031D4;

    struct Gig {
        address payable owner;
        string gig;
        string description;
        string location;
        uint price;
        uint sold;
    }

    mapping (uint => Gig) internal gigs;

    function writeGig(
        string memory _gig,
        string memory _description, 
        string memory _location, 
        uint _price
    ) public {
        uint _sold = 0;
        gigs[gigsLength] = Gig(
            payable(msg.sender),
            _gig,
            _description,
            _location,
            _price,
            _sold
        );
        gigsLength++;
    }

    function readGig(uint _index) public view returns (
        address payable,
        string memory, 
        string memory, 
        string memory, 
        uint, 
        uint
    ) {
        return (
            gigs[_index].owner,
            gigs[_index].gig, 
            gigs[_index].description, 
            gigs[_index].location, 
            gigs[_index].price,
            gigs[_index].sold
        );
    }
    
    function buyGig(uint _index) public payable  {
        require(
          IERC20Token(cUsdTokenAddress).transferFrom(
            msg.sender,
            gigs[_index].owner,
            gigs[_index].price
          ),
          "Transfer failed."
        );
        gigs[_index].sold++;
    }
    
    function getGigsLength() public view returns (uint) {
        return (gigsLength);
    }
}