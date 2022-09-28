const client = require('./elastic_connection');

async function deleteAndCreateIndex() {
    try {
        await client.indices.delete( {
            index: 'ebay' 
        });

        await client.indices.create({
            index: 'ebay'
        });
    
        await client.indices.delete({
            index: 'shpock',
        });

        await client.indices.create({
            index: 'shpock',
        });
    } catch (err) { console.log(err); }
}

async function searchAll(index) {
    const products = await client.search({
        size: 500,
        index,
        query: { match_all: {} },
    });
    console.log(products.hits.hits.length);
}

searchAll('ebay');
// deleteAndCreateIndex();