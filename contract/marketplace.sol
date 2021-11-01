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
    address internal cUsdTokenAddress = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;

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

contract GigReview {

    uint internal reviewsLength = 0;
    address internal cUsdTokenAddress = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;

    struct Review {
        address payable owner;
        string comment;
        uint rating;
        uint price;
        uint sold;
    }

    mapping (uint => Review) internal reviews;

    function writeReview(
        string memory _comment, 
        uint _rating,
        uint _price
    ) public {
        uint _sold = 0;
        reviews[reviewsLength] = Review(
            payable(msg.sender),
            _comment,
            _rating,
            _price,
            _sold
        );
        reviewsLength++;
    }

    function readReview(uint _index) public view returns (
        address payable,
        string memory, 
        uint,
        uint,
        uint
    ) {
        return (
            reviews[_index].owner,
            reviews[_index].comment, 
            reviews[_index].rating,
            reviews[_index].price,
            reviews[_index].sold
        );
    }
    
    function buyReview(uint _index) public payable  {
        require(
          IERC20Token(cUsdTokenAddress).transferFrom(
            msg.sender,
            reviews[_index].owner,
            reviews[_index].price
          ),
          "Transfer failed."
        );
        reviews[_index].sold++;
    }
    
    function getReviewsLength() public view returns (uint) {
        return (reviewsLength);
    }
}