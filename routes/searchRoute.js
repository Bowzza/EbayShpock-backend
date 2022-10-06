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
            console.log('test');
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
    let searchResults = ebayProducts.hits.hits.concat(shpockProducts.hits.hits);
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
    let products = await Promise.all(
        ebay.productsEbay(req.params.product, page),
        shpock.productsShpock(req.params.product, )
    ); 

    if(searchInfo) {
        searchInfo.ebayPage++;
        try {
            await searchInfo.save();
        } catch(err) { console.log(err.message); }
    }

    saveProductsToElastic(products, null);

    const productsToAdd = 10 - searchResults.length;
    products.forEach((product, index) => {
        if(index <= productsToAdd) searchResults.push(product);
    });
    
    searchResults = mapProducts(searchResults);
    res.json(searchResults);
});


async function saveProductsToElastic(firstArr, secondArr) {
    console.log('firstArr: '+firstArr);
    console.log('secondArr: '+secondArr);
    try {
        for(const product of firstArr) {
            await client.index({
                index: 'ebay',
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
        
        if(!secondArr) {
            await client.indices.refresh();
            return;
        }
        for(const product of secondArr) {
            await client.index({
                index: 'shpock',
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
        await client.indices.refresh();
    } catch(err) { console.log(err); }
}


async function searchProduct(index, searchTerm, from, size) {
    // const result = await elasticsearch.search({
    //     index: index,
    //     from,
    //     size,
    //     query: {
    //         dis_max: {
    //             queries: [
    //                 { match: {'productName': { query: searchTerm, minimum_should_match: 1, fuzziness: 2 } } },
    //                 { match_phrase_prefix: { 'productName': {query: searchTerm } } },
    //                 { term: { 'productName': searchTerm } },
    //                 { wildcard: { 'productName': { value: '*'+searchTerm+'*'} } }
    //             ]
    //         }
    //     }
    // });
    let result;
    try {
        result = await client.search({
            index,
            from,
            size,
            query: {
                bool: {
                    should: [
                        {
                            match_phrase_prefix: {'name': { query: searchTerm, slop: 2 } } 
                        },
                        {
                            match: {'name': { query: searchTerm, minimum_should_match: 1, fuzziness: 2 } } 
                        }
                    ]
                }
            }
        });
    } catch(err) { console.log(err); }

    return result;
}

function mapProducts(arr) {
    // const products = [];
    // arr.map(product => {
    //     product._source ? products.push(product._soource) : products.push(product);
    // });
    // return products;
    return arr.map((product) => product._source ?? product);
}


module.exports = router;