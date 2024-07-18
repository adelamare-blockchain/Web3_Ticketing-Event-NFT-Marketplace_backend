// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Counters} from "@openzeppelin/contracts/utils/Counters.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract NFT is ERC721URIStorage {
     using Counters for Counters.Counter;

     Counters.Counter private _tokenIds;

     address immutable contractAddress;

     constructor(address _marketPlaceAddress) ERC721("Euronixa Ticket", "TICKET") {
        require(_marketPlaceAddress != address(0), "invalid address");
        contractAddress = _marketPlaceAddress;
    }

    function mintNFT(string memory _tokenURI) external returns(uint){
      // Incrémentation du token Id
      _tokenIds.increment();
      uint256 newTokenId = _tokenIds.current();
      
      _mint(msg.sender, newTokenId);
      // Vérifier que le NFT avec cet ID existe avant de définir son URI
      require(_exists(newTokenId), "Token with this ID does not exist");
      // Définir l'URI avant de transférer le NFT
      _setTokenURI(newTokenId, _tokenURI);
      // Autorise la marketplace l'approbation de transactions entre utilisateurs
      setApprovalForAll(contractAddress, true);

      return newTokenId;
    }
}