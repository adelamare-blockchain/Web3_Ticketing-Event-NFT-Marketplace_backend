// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Counters} from "@openzeppelin/contracts/utils/Counters.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

import "hardhat/console.sol";

contract Marketplace is Ownable, ReentrancyGuard {

    using SafeMath for uint256;
    using Counters for Counters.Counter;

    // Compteur d'evenements
    Counters.Counter private _eventIds;

    // Compteur de NFT mintés + NFT vendus
    Counters.Counter private _itemIds;
    Counters.Counter private _itemsSold;

    // Propriétaire du contrat
    address public immutable adminOwner;
    uint256 public immutable adminCommissionFee;

    // Variable 2 : The minimum price of one NFT
    uint256 public listingPrice = 0.025 ether;

    // CONSTRUCTOR
    constructor(uint256 _feePercent){
      adminOwner = msg.sender;
      adminCommissionFee = _feePercent;
    }
    
    // Struct d'EVENEMENT
    struct Event {
        uint256 eventId;
        string title;
        string description;
        uint256 startTime;
        uint256 endTime;
        uint256 ticketPrice;
        string imageURL;
        bool active;
    }

    // mapping EVENEMENT : KEY eventId(uint) => VALUE: Event(struct)
    mapping(uint256 => Event) public events;

    // event EVENEMENT créé
    event EventActivated(
        uint256 indexed eventId,
        address indexed admin,
        uint256 startTime,
        bool isActive
    );

    // Struct NFT MINTE
    struct MarketItem {
      uint256 eventId;
      uint256 itemId;
      address nftContract;
      uint256 tokenId;
      address payable seller;
      address payable owner;
      uint256 price;
      bool sold;
    }

    // mapping NFTs ajoutés à la marketplace  : KEY itemId(uint) => VALUE: NFT(struct)]
    mapping(uint256 => MarketItem) private idToMarketItem;

    // event NFT MINTE créé
    event MarketItemCreated (
      uint256 eventId,
      uint256 indexed itemId,
      address indexed nftContract,
      uint256 indexed tokenId,
      address seller,
      address owner,
      uint256 price,
      bool sold
    );

    /* Updates the listing price of the contract */
    function updateListingPrice(uint256 _listingPrice) public payable onlyOwner {
      listingPrice = _listingPrice;
      emit actualisedListingPrice(_listingPrice);
    }

    event actualisedListingPrice(
      uint256 listingPrice
    );

    /* Returns the listing price of the contract */
    function getListingPrice() public view returns (uint256) {
      return listingPrice;
    }

    /* Creates an event by an admin */
    function createEvent(
        string memory _title,
        string memory _description,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _ticketPrice,
        string memory _imageURL
      ) external onlyOwner returns (uint256) {
        require(bytes(_title).length > 0, "Event title cannot be empty.");
        require(bytes(_description).length > 0, "Description cannot be empty.");
        require(_ticketPrice > 0, "ticket Price must be greater than 0.");
        require(_startTime > block.timestamp, "Event must start in the future");
        require(_endTime > _startTime, "Event end time must be after start time");
        require(bytes(_imageURL).length > 0, "Image URL cannot be empty.");

        _eventIds.increment();
        uint256 newEventId = _eventIds.current();

        events[newEventId] = Event({
            eventId: newEventId,
            title: _title,
            description: _description,
            startTime: _startTime,
            endTime: _endTime,
            ticketPrice: _ticketPrice,
            imageURL: _imageURL,
            active: true
        });

        emit EventActivated(
            newEventId,
            msg.sender,
            _startTime,
            true
        );
        return newEventId;
    }

    /* Mints a token inside NFT.sol */

    /* Mints a token and lists it in the marketplace */
    function createMarketTicket(uint256 _eventId, address _nftContract, uint256 _tokenId, uint256 _price) external payable nonReentrant returns (uint) {
      Event storage eventStorage = events[_eventId];
      require(eventStorage.endTime > block.timestamp, "Event has ended");
      require(eventStorage.active, "Event is not active");
      require(_price > 0, "Price must be at least 1 wei");
      require(msg.value == listingPrice, "Price must be equal to listing price");

      // Mint du token dans le contract NFT par user
      _itemIds.increment();
      uint256 newItemId = _itemIds.current();

      // Actualisation de l'eventId
      uint eventId = eventStorage.eventId;

      idToMarketItem[newItemId] =  MarketItem(
        eventId,
        newItemId,
        _nftContract,
        _tokenId,
        payable(msg.sender),
        payable(address(this)),
        _price,
        false
      );

      emit MarketItemCreated(
        eventId,
        newItemId,
        _nftContract,
        _tokenId,
        msg.sender,
        address(this),
        _price,
        false
      );

      require( 
      IERC721(_nftContract).isApprovedForAll(msg.sender, address(this)), "Marketplace is not approved to spend this NFT"); 
      
      IERC721(_nftContract).transferFrom(msg.sender, address(this), _tokenId);
      return newItemId;
    }

    /* Creates the sale of a marketplace item */
    /* Transfers ownership of the item, as well as funds between parties */
    function createMarketSale(uint256 _itemId, address _nftContract
      ) external payable nonReentrant returns(uint256) {
      require(bytes(events[idToMarketItem[_itemId].eventId].title).length > 0, "Event does not exist");
      require(events[idToMarketItem[_itemId].eventId].active, "Event is not active");

      // Récupération du prix du NFT
      uint price = idToMarketItem[_itemId].price;
      // Récupération du tokenId du NFT
      uint tokenId = idToMarketItem[_itemId].tokenId;
      // Récupération du seller
      address seller = idToMarketItem[_itemId].seller;


      require(msg.value >= price, "not enough ether to cover item price and market fee"); // Check si NFT est vendable au prix adéquat
      require(tokenId > 0, "item doesn't exist"); // Check si NFT existe
      require(!idToMarketItem[_itemId].sold, "item already sold"); // Check si NFT marqué comme vendu

      // Calculate the commission
      uint256 commission = SafeMath.div((SafeMath.mul(price, adminCommissionFee)), 100);

      // Amount seller
      uint256 sellerAmount = SafeMath.sub(price, commission);

      // Check des montants supérieurs à 0
      require(sellerAmount > 0, "sellerAmount must be > 0");
      require(commission > 0, "commission fee must be > 0");

      // Modification du propriétaire du NFT dans le mapping + NFT déclaré VENDU
      idToMarketItem[_itemId].owner = payable(msg.sender);
      idToMarketItem[_itemId].sold = true;

      // Incrémentation de l'item vendu
      _itemsSold.increment();
      uint256 newItemSold = _itemsSold.current();

      // Transfert de propriété du NFT
      IERC721(_nftContract).transferFrom(address(this), msg.sender, tokenId);
      
      // Transfert des fonds
      payable(seller).transfer(sellerAmount);
      
      // Transfer the commission to adminOwner
      payable(adminOwner).transfer(commission);
  
      return newItemSold;
    }

    /* Returns all the events */
    function getEvents() public view returns (Event[] memory) {
      uint256 totalEventCount = _eventIds.current();

      Event[] memory totalEvents = new Event[](totalEventCount);
        
        for (uint256 i = 0; i < totalEventCount; i++) {
            uint currentId = i + 1;
            if (events[currentId].active && block.timestamp < events[currentId].endTime) {
              Event storage item = events[currentId];
              totalEvents[i] = item;
           }
        }
        return totalEvents;
    }

    /* Returns all market items */
    function fetchAllMarketItems() public view returns (MarketItem[] memory) {
      uint256 itemCount = _itemIds.current();
      uint256 currentIndex = 0;

      MarketItem[] memory items = new MarketItem[](itemCount);
      for (uint i = 0; i < itemCount; i++) {
        uint currentId = idToMarketItem[i + 1].itemId;
        MarketItem storage currentItem = idToMarketItem[currentId];
        items[currentIndex] = currentItem;
        currentIndex += 1;
      }
      return items;
    }

    /* Returns all unsold market items */
    function fetchMarketItems() public view returns (MarketItem[] memory) {
      uint256 itemCount = _itemIds.current();
      uint256 unsoldItemCount = _itemIds.current() - _itemsSold.current();
      uint256 currentIndex = 0;

      MarketItem[] memory items = new MarketItem[](unsoldItemCount);
      for (uint i = 0; i < itemCount; i++) {
        if (idToMarketItem[i + 1].owner == address(this)) {
          uint currentId = idToMarketItem[i + 1].itemId;
          MarketItem storage currentItem = idToMarketItem[currentId];
          items[currentIndex] = currentItem;
          currentIndex += 1;
        }
      }
      return items;
    }

    /* Returns all market items by eventId */
    function fetchMarketItemsByEventId(uint _eventId) public view returns (MarketItem[] memory) {
      uint totalItemCount = _itemIds.current();
      uint itemCount = 0;
      uint currentIndex = 0;

      for (uint i = 0; i < totalItemCount; i++) {
        if (idToMarketItem[i + 1].eventId == _eventId) {
          itemCount += 1;
        }
      }
      
      MarketItem[] memory items = new MarketItem[](itemCount);
      for (uint i = 0; i < totalItemCount; i++) {
        if (idToMarketItem[i + 1].eventId == _eventId) {
          uint currentId = idToMarketItem[i + 1].itemId;
          MarketItem storage currentItem = idToMarketItem[currentId];
          items[currentIndex] = currentItem;
          currentIndex += 1;
        }
      }
      return items;
      
    }


    /* Returns only items that a user has purchased */
    function fetchMyNFTs() public view returns (MarketItem[] memory) {
      uint totalItemCount = _itemIds.current();
      uint itemCount = 0;
      uint currentIndex = 0;

      for (uint i = 0; i < totalItemCount; i++) {
        if (idToMarketItem[i + 1].owner == msg.sender) {
          itemCount += 1;
        }
      }

      MarketItem[] memory items = new MarketItem[](itemCount);
      for (uint i = 0; i < totalItemCount; i++) {
        if (idToMarketItem[i + 1].owner == msg.sender) {
          uint currentId = idToMarketItem[i + 1].itemId;
          MarketItem storage currentItem = idToMarketItem[currentId];
          items[currentIndex] = currentItem;
          currentIndex += 1;
        }
      }
      return items;
    }

    /* Returns only items a user has listed */
    function fetchItemsCreated() public view returns (MarketItem[] memory) {
      uint totalItemCount = _itemIds.current();
      uint itemCount = 0;
      uint currentIndex = 0;

      for (uint i = 0; i < totalItemCount; i++) {
        if (idToMarketItem[i + 1].seller == msg.sender) {
          itemCount += 1;
        }
      }

      MarketItem[] memory items = new MarketItem[](itemCount);
      for (uint i = 0; i < totalItemCount; i++) {
        if (idToMarketItem[i + 1].seller == msg.sender) {
          uint currentId = idToMarketItem[i + 1].itemId;
          MarketItem storage currentItem = idToMarketItem[currentId];
          items[currentIndex] = currentItem;
          currentIndex += 1;
        }
      }
      return items;
    }

    // function claimCommissionFee() external onlyOwner returns (uint){
    //   require(adminBalance > 0, "No fees to claim on adminBalance");
    //   require(msg.sender != address(0), "Incorrect address claimer");
    //   uint256 totalAmount = adminBalance;
    //   adminBalance = 0;
    //   // Transfer the commission to adminOwner
    //   payable(msg.sender).transfer(totalAmount);
    //   return totalAmount;
    // }

    
    /* Returns all unsold market items */
    // /* allows someone to resell a token they have purchased */
    // function resellToken(uint _eventId, uint256 _tokenId, uint256 _price) external payable {
    //   require(idToMarketItem[_eventId][_itemId].owner == msg.sender, "Only item owner can perform this operation");
    //   require(msg.value == listingPrice, "Price must be equal to listing price");
      
    //   Event storage eventId = events[_eventId];
    //   require(bytes(eventId.title).length > 0, "Event does not exist");
    //   require(eventId.startTime <= block.timestamp, "Event has not started yet");
    //   require(eventId.endTime >= block.timestamp, "Event has ended");
    //   require(eventId.active, "Event is not active");
    //     idToMarketItem[_eventId][_tokenId].sold = false;
    //     idToMarketItem[_eventId][_tokenId].price = _price;
    //     idToMarketItem[_eventId][_tokenId].seller = payable(msg.sender);
    //     idToMarketItem[_eventId][_tokenId].owner = payable(address(this));
    //     _itemsSold.decrement();

    //     _transfer(msg.sender, address(this), _tokenId);
    // }
}