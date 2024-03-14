// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract ECOVERIFY is Ownable{

    constructor(address initialOwner) Ownable(initialOwner) {}
    
    struct blackSeedOil{
        uint id;
        address manufacturer;
        string destination;
        uint volume;
        uint price;
        bool onlyForExport;
        bool sold;
    }

    uint public productId;

    // Setting shops
    mapping(address => bool) public isAuthorizedShop;
    mapping(uint => blackSeedOil) public oilInformation;
 
    // granting access to shops
    function _toggelAccess(address _userAddress, bool _bool) private {
        isAuthorizedShop[_userAddress] =_bool;
    }

    // Function to grant access
    function grantAccess(address _userAddress) external onlyOwner{
        // check current status
        require(isAuthorizedShop[_userAddress] == false, 'Already has access');
        _toggelAccess(_userAddress, true);
    }

    // Function to revoke access
    function revokeAccess(address _userAddress) external onlyOwner{
        require(isAuthorizedShop[_userAddress] == true, 'Already has no access');
        _toggelAccess(_userAddress, false);
    }

    // Manufacturer will produce the Oils
    function produceOilLocal(uint _volume, uint _price) public onlyOwner{
        productId++ ;
        oilInformation[productId].id = productId;
        oilInformation[productId].manufacturer = msg.sender;
        oilInformation[productId].volume = _volume;
        oilInformation[productId].price = _price;
    }

    function produceOilExport(uint _volume, uint _price) public onlyOwner{
        productId++ ;
        oilInformation[productId].id = productId;
        oilInformation[productId].manufacturer = msg.sender;
        oilInformation[productId].volume = _volume;
        oilInformation[productId].onlyForExport = true;
        oilInformation[productId].price = _price;
    }

    function sellOil(uint _id, string memory _destination) public {

        // Checking if the product is existing;
        require(_id <= productId && _id!=0,'Product does not exist');
        // product sold or not
        require(oilInformation[_id].sold == false, 'Product already sold');
        // Check if the oil seller is genuine
        require(isAuthorizedShop[msg.sender] == true, 'Not authorized');

        // Selling foreign product
        if(oilInformation[_id].onlyForExport){
            bytes memory desinationLength = bytes(_destination);
            require(desinationLength.length != 0,'Destination field empty');
            oilInformation[_id].destination = _destination;
            oilInformation[_id].sold = true;
        }
        // Selling local product
        else if(!oilInformation[_id].onlyForExport){
            oilInformation[_id].sold = true;
        }
        else {
            revert("Something not correct");
        }
    }

}