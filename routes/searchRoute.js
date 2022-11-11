const express = require('express');
const router = express.Router();
const ebay = require('../shops/ebay');
const shpock = require('../shops/shpock');
const client = require('../elastic_connection');
const SearchInfo = require('../model/SearchInfo');


router.get('/:product', async (req, res) => {
    if(!req.params.product) return res.status(404).json({ message: 'No product name found.' });
    let searchResults;
    try {
        const ebayProducts = await searchProduct('ebay', req.params.product, 0, 10); 
        const shpockProducts = await searchProduct('shpock', req.params.product, 0, 10); 
        searchResults = ebayProducts.hits.hits.concat(shpockProducts.hits.hits);
        if(searchResults.length > 9) {
            searchResults = mapProducts(searchResults);
            return res.json(searchResults);
        }
    } catch(err) {console.log(err)}

    const products = await Promise.all([
        ebay.productsEbay(req.params.product, 0),
        shpock.productsShpock(req.params.product)
    ]);

    
    const scrappedProducts = [];
    const scrappedEbay = products[0];
    const scrappedShpock = products[1];
    
    for(let i = 1; i < scrappedEbay.length; i++) {
        if(i <= 10) scrappedProducts.push(scrappedEbay[i]);
    }

    for(let i = 1; i < scrappedShpock.length; i++) {
        if(i <= 10) scrappedProducts.push(scrappedShpock[i]);
    }

    res.json(scrappedProducts);

    saveProductsToElastic(products[0], products[1]);
});


router.post('/:product', async (req, res) => {
    if(!req.params.product) return res.status(404).json({ message: 'No product name found.' });

    const ebayNumberOfProducts = req.body.ebay;
    const shpockNumberOfProducts = req.body.shpock;

    const ebayProducts = await searchProduct('ebay', req.params.product, ebayNumberOfProducts, 10); 
    const shpockProducts = await searchProduct('shpock', req.params.product, shpockNumberOfProducts, 10); 

    let searchResults;
    if(ebayProducts && shpockProducts) {
        searchResults = ebayProducts.hits.hits.concat(shpockProducts.hits.hits);
    } else {
        searchResults = ebayProducts.hits.hits;
    }

    if(searchResults.length >= 10) {
        searchResults = mapProducts(searchResults);
        return res.json(searchResults);
    }
    const searchInfo = await SearchInfo.findOne({ searchTerm: req.params.product });
    let page = 2;
    if(searchInfo) {
        page = searchInfo.ebayPage;
    } else {
        const searchInfoEntry = new SearchInfo({
            searchTerm: req.params.product,
            ebayPage: 3
        });
        try {
            await searchInfoEntry.save();
        } catch(err) { console.log(err.message); }
    }
    let products;
    try {
        products = await ebay.productsEbay(req.params.product, page);
    } catch (err) {console.log(err);}
    

    if(searchInfo) {
        searchInfo.ebayPage++;
        try {
            await searchInfo.save();
        } catch(err) { console.log(err.message); }
    }


    const productsToAdd = 10 - searchResults.length;
    products.forEach((product, index) => {
        if(index <= productsToAdd) searchResults.push(product);
    });
    
    searchResults = mapProducts(searchResults);
    res.json(searchResults);

    saveProductsToElastic(products, undefined);

});


async function saveProductsToElastic(firstArr, secondArr) {
    if(firstArr) saveToElastic(firstArr, 'ebay');
    if(secondArr) saveToElastic(secondArr, 'shpock');
}

async function saveToElastic(products, index) {
    try {
        for(const product of products) {
            const stored = await checkIfProductIsStored(product.articleNumber, index)
            if(!stored) {
                await client.index({
                    index,
                    body: {
                        articleNumber: product.articleNumber,
                        productName: product.productName,
                        description: product.description,
                        price: product.price,
                        currency: product.currency,
                        link: product.link,
                        img: product.img,
                        shop: product.shop
                    }
                });
            }
        }
        await client.indices.refresh();
    } catch(err) { console.log(err); }
}


async function searchProduct(index, searchTerm, from, size) {
    let result;
    try {
        result = await client.search({
            index,
            from,
            size,
            query: {
                match: {
                    "productName": {
                        query: searchTerm,
                        operator: "and",
                        fuzziness: "auto"
                    }
                }
            }
        });
    } catch(err) { console.log(err); }

    return result;
}

function mapProducts(arr) {
    return arr.map((product) => product._source ?? product);
}

async function checkIfProductIsStored(articleNumber, index) {
    let result;
    isStored = false;
    try {
        result = await client.search({
            index,
            query: {
                match: {
                    "articleNumber": {
                        query: articleNumber,
                    }
                }
            }
        });
    } catch(err) { console.log(err); }
    if(result.hits.hits.length !== 0) isStored = true;
    return isStored;
}

module.exports = router;