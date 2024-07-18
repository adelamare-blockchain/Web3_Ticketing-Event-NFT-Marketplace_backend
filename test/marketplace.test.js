const { expect } = require('chai');
const { ethers } = require('hardhat');

const convertToWei = (num) => ethers.utils.parseEther(num.toString());
const convertFromWei = (num) => ethers.utils.formatEther(num);

describe('Marketplace', function () {
  let marketplace;
  let nft;
  let owner;
  let addr1;
  let addr2;
  let addr3;
  let addrs;
  let listingPrice;
  let ticketPrice = convertToWei(0.025);
  let ticketPrice1 = convertToWei(0.03); // Prix de mint par addr1
  let ticketPrice2 = convertToWei(0.06); // Prix de mint par addr2
  let eventTitle = 'Inauguration Event';
  let eventDescription =
    'Premium mint of 100 tickets for first Bundle';
  let startTime = Math.floor(Date.now() / 1000) + 3600; // Starts 1 hour from now
  let endTime = startTime + 3600; // Ends 1 hour after start
  let imageURL = 'https://welcome-to-the-marketplace/image.png';
  let tokenURI = 'https://www.mytokenlocation.com';
  let eventsList;
  let event1;
  let marketItems;

  beforeEach(async function () {
    // Mise en place de la commission
    const adminCommissionFee = 2;
    // Déploiement du smart contract 'Marketplace.sol' avant le test
    const Market = await ethers.getContractFactory('Marketplace');
    marketplace = await Market.deploy(adminCommissionFee);
    await marketplace.deployed();

    // Déploiement du smart contract 'NFT.sol' avant le test
    const NFT = await ethers.getContractFactory('NFT');
    nft = await NFT.deploy(marketplace.address);
    await nft.deployed();

    // Récupération de l'adresse du propriétaire et des utilisateurs
    [owner, addr1, addr2, addr3, ...addrs] =
      await ethers.getSigners();

    // Création of first Event by adminOwner
    await marketplace.createEvent(
      eventTitle,
      eventDescription,
      startTime,
      endTime,
      ticketPrice,
      imageURL
    );

    // Création of second Event by adminOwner
    await marketplace.createEvent(
      'Premium Metaverse Crypto congress',
      'Metaverse Crypto Asset Congress with Satoshi Nakamoto',
      Math.floor(Date.now() / 1000) + 36000, // Starts 10 hour from now,
      startTime + 36000, // Ends 10 hours after start
      convertToWei(0.1),
      'https://congress.io/image.png'
    );

    // Get the initial listing price
    const listingPrice = await marketplace.getListingPrice();
    expect(ticketPrice).to.be.at.least(listingPrice);

    /* create four tokens */
    // Mint token 1 by buyer1
    await nft.connect(addr1).mintNFT(tokenURI);

    // Mint token2 by buyer2
    await nft.connect(addr2).mintNFT(tokenURI);

    // Mint token3 by buyer1
    await nft.connect(addr1).mintNFT(tokenURI);

    // Mint token4 by buyer3
    await nft.connect(addr3).mintNFT(tokenURI);

    /* create 3 items in the market */
    // addr1 mints an nft for the created event with ticketPrice
    await marketplace
      .connect(addr1)
      .createMarketTicket(1, nft.address, 1, ticketPrice1, {
        value: listingPrice, // Prix du premier NFT
      });
    // addr2 mints an nft for the same event with 0.06 ethers
    await marketplace
      .connect(addr2)
      .createMarketTicket(1, nft.address, 2, ticketPrice2, {
        value: listingPrice, // Prix du deuxième NFT
      });

    // addr1 mints an nft for the second event with 0.1 ethers
    await marketplace
      .connect(addr1)
      .createMarketTicket(2, nft.address, 3, convertToWei(0.1), {
        value: listingPrice, // Prix du premier NFT
      });
  });

  describe('Deployment', function () {
    it('Should deploy the contract correctly', async function () {
      const contractOwner = await marketplace.owner();
      expect(contractOwner).to.equal(owner.address);

      console.log(`Marketplace Contract: `, marketplace.address);
      console.log(`NFT Contract: ${nft.address}`);
      console.log(`Owner : ${owner.address}`);
      console.log(`addr1 : ${addr1.address}`);
      console.log(`addr2 : ${addr2.address}`);
      console.log(`addr3 : ${addr3.address}`);
    });

    it('Should track name and symbol of the nft collection', async function () {
      const name = await nft.name();
      const symbol = await nft.symbol();

      expect(name).to.equal('Euronixa Ticket');
      expect(symbol).to.equal('TICKET');
    });

    it('Should update the listing price', async function () {
      // Get the initial listing price
      const listingPrice = await marketplace.getListingPrice();
      expect(listingPrice).to.equal(convertToWei(0.025));

      // Define a new listing price
      const newListingPrice = convertToWei(0.03);

      // Update the listing price
      await marketplace.updateListingPrice(newListingPrice);

      // Check if the listing price has been updated
      const updatedListingPrice = await marketplace.getListingPrice();
      expect(updatedListingPrice).to.equal(newListingPrice);
    });
  });

  describe('Tests Fonctionnels NFT Marketplace Contract', () => {
    // Test Function 1 : createEvent()
    describe('Function 1 : createEvent()', () => {
      it('Should create an event', async function () {
        // Obtenez la liste des événements actifs en utilisant la fonction getEvents
        // Ajout de l'event créé à la liste des events
        eventsList = await marketplace.getEvents();

        // Event Id de l'event numero 1
        event1 = eventsList[0];

        // Vérifiez que la liste des événements actifs contient au moins un événement
        expect(eventsList.length).to.be.greaterThan(0);

        // Vérifiez les détails de l'événement créé
        expect(event1.eventId).to.equal(1);
        expect(event1.title).to.equal('Inauguration Event');
        expect(event1.description).to.equal(
          'Premium mint of 100 tickets for first Bundle'
        );
        expect(event1.startTime).to.equal(startTime);
        expect(event1.endTime).to.equal(endTime);
        expect(event1.ticketPrice).to.equal(convertToWei(0.025));
        expect(event1.imageURL).to.equal(
          'https://welcome-to-the-marketplace/image.png'
        );
        expect(event1.active).to.equal(true);
      });
      it('should returns all created events of the marketplace', async () => {
        /* query for and return the unsold items */
        const events = await marketplace.getEvents();
        eventsList = await Promise.all(
          events.map(async (i) => {
            let event = {
              eventId: `Bundle n°${i.eventId.toNumber()}`,
              title: i.title,
              description: i.description,
              startTime: new Date(
                i.startTime * 1000
              ).toLocaleString(),
              endTime: new Date(i.endTime * 1000).toLocaleString(),
              ticketPrice: `${convertFromWei(i.ticketPrice)} ETH`,
              imageURL: i.imageURL,
              active: i.active,
            };
            return event;
          })
        );
        console.log(
          `Events published on the marketplace : `,
          eventsList
        );
      });
    });

    describe('Minting of 3 new NFTs', function () {
      // Test Function 2 : createMarketTicket()
      it('Should track 3 new minted NFTs', async function () {
        // Ajout de l'event créé à la liste des events
        eventsList = await marketplace.getEvents();
        // Event Id de l'event numero 1
        event1 = eventsList[0];
        expect(event1.eventId).to.equal(1);

        // Récupérez la liste des NFT nouvellements créés
        const items = await marketplace.fetchMarketItems();

        // Vérifie que 2 tokens ont été ajoutés à la marketplace
        expect(items.length).to.equal(3);
        // Vérifiez que les utilisateur ayant minté les NFTs sont corrects
        expect(await items[0].seller).to.equal(addr1.address);
        expect(await items[1].seller).to.equal(addr2.address);

        // Vérifiez que les token Id des NFTs sont corrects
        expect(await items[0].tokenId).to.equal(1);
        expect(await items[1].tokenId).to.equal(2);
      });
      it('Should fail if ticketPrice is not equal to listingPrice', async function () {
        listingPrice = await marketplace.getListingPrice();

        // TicketPrice inférieur au listingPrice :
        const wrongTicketPrice = convertToWei(0.001);

        // addr3 mints an nft for the same event with 0.06 ethers
        await marketplace
          .connect(addr3)
          .createMarketTicket(2, nft.address, 4, wrongTicketPrice, {
            value: listingPrice,
          }); // Prix du troisième NFT

        // Récupérez la liste des NFT nouvellements créés
        marketItems = await marketplace.fetchMarketItems();
        expect(marketItems[3]).to.be.revertedWith(
          'Price must be equal to listing price'
        );
      });
    });

    describe('Function 3 : createMarketTicket()', () => {
      it('Should transfer minted NFTs from seller to marketplace', async () => {
        // Owner of NFT should now be the marketplace
        // Récupérez la liste des NFT nouvellements créés
        marketItems = await marketplace.fetchMarketItems();
        // Vérification de la propriété des NFTs cédés à la marketplace
        console.log('Market Item 2 owner', marketItems[1].owner);
        console.log('Market Item 2 seller', marketItems[1].seller);

        expect(await marketItems[0].owner).to.equal(
          marketplace.address
        );
        expect(await marketItems[1].owner).to.equal(
          marketplace.address
        );
      });

      it('Should emit offered event for 2 new NFTs on marketplace', async () => {
        // Vérifiez que les NFTs sont listés via les events de la function createMarketTicket()
        marketItems = await marketplace.fetchMarketItems();

        // Verify that the NFTs have been transferred to the marketplace
        expect(marketItems[0])
          .to.emit(marketplace, 'MarketItemCreated')
          .withArgs(
            1,
            1,
            nft.address,
            1,
            addr1.address,
            marketplace.address,
            ticketPrice1,
            false
          );
        expect(marketItems[1])
          .to.emit(marketplace, 'MarketItemCreated')
          .withArgs(
            1,
            2,
            nft.address,
            2,
            addr2.address,
            marketplace.address,
            ticketPrice2,
            false
          );
      });
    });

    describe('Function 4 : fetchAllMarketItems()', () => {
      it('should returns all the fetched market items', async () => {
        /* query for and return the unsold items */
        marketItems = await marketplace.fetchMarketItems();
        marketItems = await Promise.all(
          marketItems.map(async (i) => {
            const event = await marketplace.events(i.eventId);
            const tokenUri = await nft.tokenURI(i.tokenId);
            const priceInEthers = convertFromWei(i.price);
            let item = {
              eventId: `Bundle n°${i.eventId}`,
              eventTitle: event.title,
              price: `${priceInEthers} ETH`,
              tokenId: i.tokenId.toString(),
              seller: i.seller,
              owner: i.owner,
              tokenUri,
            };
            return item;
          })
        );
        console.log(
          `All NFTs published on the marketplace : `,
          marketItems
        );
      });
    });

    describe('Function 5 : fetchItemsCreated()', () => {
      it('should returns the fetch market items of one creator (addr1)', async () => {
        /* query for and return the unsold items */
        marketItems = await marketplace
          .connect(addr1)
          .fetchItemsCreated();
        marketItems = await Promise.all(
          marketItems.map(async (i) => {
            const event = await marketplace.events(i.eventId);
            const tokenUri = await nft.tokenURI(i.tokenId);
            const priceInEthers = convertFromWei(i.price);

            let item = {
              eventId: `Bundle n°${i.eventId}`,
              eventTitle: event.title,
              price: `${priceInEthers} ETH`,
              tokenId: i.tokenId.toString(),
              seller: i.seller,
              owner: i.owner,
              tokenUri,
            };
            return item;
          })
        );
        console.log(
          `addr1's NFTs published on the marketplace : `,
          marketItems
        );
      });
    });

    describe('Function 6 : fetchMarketItemsByEventId()', () => {
      it('should returns the fetch market items of one event (event1)', async () => {
        // Ajout de l'event créé à la liste des events
        eventsList = await marketplace.getEvents();

        // Event Id de l'event numero 1 (eventsList[0])
        const eventId = eventsList[0].eventId;

        /* query for and return the unsold items */
        marketItems = await marketplace
          .connect(addr1)
          .fetchMarketItemsByEventId(eventId);

        // Récupération des nfts dans event 1
        marketItems = await Promise.all(
          marketItems.map(async (i) => {
            const tokenUri = await nft.tokenURI(i.tokenId);
            const priceInEthers = convertFromWei(i.price);

            let item = {
              eventId: i.eventId.toNumber(),
              itemId: i.itemId.toNumber(),
              tokenId: i.tokenId.toNumber(),
              seller: i.seller,
              owner: i.owner,
              tokenUri: tokenUri,
              price: `${priceInEthers} ETH`,
            };
            return item;
          })
        );
        console.log(
          `NFTs of Bundle n°${eventId} published on the marketplace :`,
          marketItems
        );
      });
    });

    describe('Function 7 : createMarketSale()', function () {
      it('should update item as sold, pay seller (addr1), transfer NFT to buyer (addr3), charge fees and emit an event', async function () {
        // AdminCommissionFeePercent
        const adminCommissionFee = 2;

        // Récupération des soldes avant la vente
        const ownerBalanceBefore = await ethers.provider.getBalance(
          owner.address
        );
        const buyerBalanceBefore = await ethers.provider.getBalance(
          addr3.address
        );
        const sellerBalanceBefore = await ethers.provider.getBalance(
          addr1.address
        );

        // Get the initial market item
        const marketItemsBefore =
          await marketplace.fetchMarketItems();
        const itemBefore = marketItemsBefore[0];

        // Addr3 appel la fonction createMarketSale() pour acheter l'item
        const tx = await marketplace
          .connect(addr3)
          .createMarketSale(1, nft.address, {
            value: itemBefore.price,
          });

        // Récupération des frais de gaz dépensés lors de la transaction
        const gasUsed = (await tx.wait()).gasUsed;
        const gasPrice = await ethers.provider.getGasPrice();
        const gasCost = gasUsed.mul(gasPrice);

        // Récupération des soldes après la vente
        const ownerBalanceAfter = await ethers.provider.getBalance(
          owner.address
        );
        const buyerBalanceAfter = await ethers.provider.getBalance(
          addr3.address
        );
        const sellerBalanceAfter = await ethers.provider.getBalance(
          addr1.address
        );

        // Vérification des mises à jour après la vente
        const marketItemsAfter = await marketplace
          .connect(addr3)
          .fetchMyNFTs();
        const itemAfter = marketItemsAfter[0];

        // Vérification que l'item a été marqué comme vendu
        expect(itemAfter.sold).to.equal(true);

        // Vérification que le propriétaire de l'item a été mis à jour
        expect(itemAfter.owner).to.equal(addr3.address);

        // Vérification que le OWNER a recu le montant correspondant
        const ownerFeeAmount = itemBefore.price
          .mul(adminCommissionFee)
          .div(100);
        const ownerBalanceDiff = ownerBalanceAfter.sub(
          ownerBalanceBefore
        );
        const ownerBalanceDiffInEthers =
          convertFromWei(ownerBalanceDiff);
        expect(ownerBalanceDiffInEthers).to.equal(
          convertFromWei(ownerFeeAmount)
        );

        // Vérification que le VENDEUR a recu le montant correspondant
        const sellerAmount = itemBefore.price.sub(
          itemBefore.price.mul(adminCommissionFee).div(100)
        );
        const sellerBalanceDiff = sellerBalanceAfter.sub(
          sellerBalanceBefore
        );
        const sellerBalanceDiffInEthers =
          convertFromWei(sellerBalanceDiff);
        expect(sellerBalanceDiffInEthers).to.equal(
          convertFromWei(sellerAmount)
        );

        // Vérification que l'acheteur a payé le montant correspondant
        const buyerAmount = itemBefore.price.add(gasCost);
        const buyerAmountInEthers = parseFloat(
          convertFromWei(buyerAmount)
        );
        const buyerBalanceDiff =
          buyerBalanceBefore.sub(buyerBalanceAfter);

        const buyerBalanceDiffInEthers = parseFloat(
          convertFromWei(buyerBalanceDiff)
        );
        expect(buyerBalanceDiffInEthers).to.be.closeTo(
          buyerAmountInEthers,
          0.03014,
          0.0000001,
          'Tolérance de 0.0000001 chiffres après la virgule'
        );

        // Vérification que le NFT a été transféré à l'acheteur
        const buyerNFTBalance = await nft.balanceOf(addr3.address);
        expect(buyerNFTBalance).to.equal(2);

        // Check if the MarketItemCreated event is emitted
        expect(
          marketplace.createMarketSale(nft.address, itemBefore.itemId)
        )
          .to.emit(marketplace, 'MarketItemCreated')
          .withArgs(
            event1.eventId,
            itemBefore.itemId,
            nft.address,
            itemBefore.tokenId,
            addr1.address,
            addr2.address,
            itemBefore.price,
            true
          );
      });

      it('should returns the sold market item bought by addr3 with fetchMyNFTs()', async () => {
        /* query for and return the sold items */
        // Get the initial market item
        const marketItemsBefore =
          await marketplace.fetchMarketItems();
        const itemBefore = marketItemsBefore[0];

        // Addr3 appel la fonction createMarketSale() pour acheter l'item
        const tx = await marketplace
          .connect(addr3)
          .createMarketSale(1, nft.address, {
            value: itemBefore.price,
          });

        marketItems = await marketplace.connect(addr3).fetchMyNFTs();
        marketItems = await Promise.all(
          marketItems.map(async (i) => {
            const event = await marketplace.events(i.eventId);
            const tokenUri = await nft.tokenURI(i.tokenId);

            const priceInEthers = convertFromWei(i.price);
            let item = {
              eventId: `Bundle n°${i.eventId}`,
              eventTitle: event.title,
              price: `${priceInEthers} ETH`,
              tokenId: i.tokenId.toString(),
              seller: i.seller,
              owner: i.owner,
              tokenUri,
            };
            return item;
          })
        );
        console.log(
          `addr3's NFTs bought on the marketplace :`,
          marketItems
        );
      });

      it('should returns all the unsold fetched market items', async () => {
        // Get the initial market item
        const marketItemsBefore =
          await marketplace.fetchMarketItems();
        const itemBefore = marketItemsBefore[0];

        // Addr3 appel la fonction createMarketSale() pour acheter l'item
        const tx = await marketplace
          .connect(addr3)
          .createMarketSale(1, nft.address, {
            value: itemBefore.price,
          });

        /* query for and return the unsold items */
        marketItems = await marketplace.fetchMarketItems();
        marketItems = await Promise.all(
          marketItems.map(async (i) => {
            const event = await marketplace.events(i.eventId);
            const tokenUri = await nft.tokenURI(i.tokenId);
            const priceInEthers = convertFromWei(i.price);
            let item = {
              eventId: `Bundle n°${i.eventId}`,
              eventTitle: event.title,
              price: `${priceInEthers} ETH`,
              tokenId: i.tokenId.toString(),
              seller: i.seller,
              owner: i.owner,
              tokenUri,
            };
            return item;
          })
        );
        console.log(
          `All Unsold NFTs published on the marketplace :`,
          marketItems
        );
      });
    });
  });
});
