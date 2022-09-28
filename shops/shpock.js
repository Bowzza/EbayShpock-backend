const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const fetch = require('node-fetch')


// module.exports = function scrapShpock(product) {
//     return new Promise(async (resolve, reject) => {
//         try {
//             const browser = await puppeteer.launch({
//                 args: [
//                   '--no-sandbox',
//                   '--disable-setuid-sandbox',
//                 ],
//                 ignoreDefaultArgs: ['--disable-extensions'],
//                 waitUntil: 'domcontentloaded'
//               });
//             const page = await browser.newPage();
//             await page.goto('https://www.shpock.com/de-at/results?q='+product);
        
//             let content = await page.evaluate(() => {
//                 let results = [];
//                 let products = document.querySelectorAll('.ldbLmI');
//                 products.forEach((product) => {
//                     const articleNumber = product.getAttribute('href').valueOf().split('/')[3];
//                     let productName = product.querySelector('.dnQQkK')?.textContent;
//                     if(!productName) productName = product.querySelector('.kccPzQ')?.textContent;
//                     let price = product.querySelector('.ItemCard__Price-sc-cy8zy7-0')?.textContent;
//                     if(!price) price = product.querySelector('.cZkYHy')?.textContent;
//                     const link = product.getAttribute('href').valueOf();
//                     try {
//                         price = price.split('€')[1].trim();
//                         // if(price.charAt(price.length-2) == '0') price = price.replace('.', '');
//                         price = price.replace('.', '');
//                         price = price.replace(',', '.');
//                     } catch(e) {}
//                     price = parseFloat(price);
//                     const img = product.querySelector('.cBHOoZ')?.getAttribute('src').valueOf() || 'no img';
//                     let inResult = false;
//                     results.forEach(item => {
//                         if(item.articleNumber === articleNumber) {
//                             inResult = true;
//                             console.log(item.articleNumber+' '+articleNumber);
//                             console.log(item.productName+' '+productName);
//                         }
//                     });
//                     if(!inResult) {
//                         results.push({
//                             articleNumber,
//                             productName,
//                             price,
//                             img,
//                             link: 'https://www.shpock.com'+link,
//                             shop: 'Shpock'
//                         });
//                     }
//                 });
//                 return results;
//             });
//             await browser.close();
//             return resolve(content);
//         } catch (e) {
//             return reject(e.message);
//         }
//     });
// }

async function productsShpock(productname) {
    let products = [];
    console.log(productname)
    try {
      const response = await fetch("https://www.shpock.com/graphql", {
        "headers": {
          "accept": "*/*",
          "accept-language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
          "content-type": "application/json",
          "sec-ch-ua": "\"Google Chrome\";v=\"105\", \"Not)A;Brand\";v=\"8\", \"Chromium\";v=\"105\"",
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": "\"Windows\"",
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "cookie": "locale=de-at; userEngaged=engaged; _gcl_au=1.1.966637623.1663265185; showPersonalizedAds=Accepted; iom_consent=0000000000&1663496985564; _gid=GA1.2.1898432102.1663609529; ioam2018=00013d41e1cb32bc86326f311:1691317785565:1663496985565:.shpock.com:36:at_w_comshpock:Service/Rubrikenmaerkte/Rubrikenmaerkteueberblick:noevent:1663618788202:wectdx; 343e975788ad2f574d40d623e1501048=5da528621b9666684184741c94ba93b9; tracking_id=nJtKX6328d623c14dbb3480321c51; webVisitShubi=sent; _ga_8RCEQX6R27=GS1.1.1663620601.10.1.1663620645.0.0.0; _ga=GA1.1.856729292.1663265185"
        },
        "referrerPolicy": "no-referrer",
        "body": "{\"operationName\":\"ItemSearch\",\"variables\":{\"trackingSource\":\"Search\",\"pagination\":{\"limit\":40},\"serializedFilters\":\"{\\\"q\\\":\\\""+productname+"\\\"}\"},\"query\":\"query ItemSearch($serializedFilters: String, $pagination: Pagination, $trackingSource: TrackingSource!) {\\n  itemSearch(\\n    serializedFilters: $serializedFilters\\n    pagination: $pagination\\n    trackingSource: $trackingSource\\n  ) {\\n    __typename\\n    od\\n    offset\\n    limit\\n    count\\n    total\\n    adKeywords\\n    locality\\n    spotlightCarousel {\\n      ...carouselSummaryFragment\\n      __typename\\n    }\\n    itemResults {\\n      distanceGroup\\n      items {\\n        ...summaryFragment\\n        __typename\\n      }\\n      __typename\\n    }\\n    filters {\\n      __typename\\n      kind\\n      key\\n      triggerLabel\\n      serializedValue\\n      status\\n      ... on CascaderFilter {\\n        dataSourceKind\\n        __typename\\n      }\\n      ... on SingleSelectListFilter {\\n        title\\n        options {\\n          __typename\\n          label\\n          subLabel\\n          badgeLabel\\n          serializedValue\\n        }\\n        defaultSerializedValue\\n        __typename\\n      }\\n      ... on MultiSelectListFilter {\\n        title\\n        submitLabel\\n        options {\\n          __typename\\n          label\\n          subLabel\\n          badgeLabel\\n          serializedValue\\n        }\\n        __typename\\n      }\\n      ... on SearchableMultiSelectListFilter {\\n        title\\n        submitLabel\\n        searchEndpoint\\n        __typename\\n      }\\n      ... on RangeFilter {\\n        title\\n        __typename\\n      }\\n      ... on LegacyPriceFilter {\\n        title\\n        __typename\\n      }\\n      ... on LegacyLocationFilter {\\n        title\\n        __typename\\n      }\\n      ... on RadioToggleFilter {\\n        options {\\n          __typename\\n          label\\n          value\\n        }\\n        defaultSerializedValue\\n        __typename\\n      }\\n    }\\n    savedSearchProposal {\\n      isAlreadySaved\\n      candidate {\\n        id\\n        name\\n        keyword\\n        serializedFilters\\n        isNotificationChannelOn\\n        isEmailChannelOn\\n        displayedFilters {\\n          name\\n          value\\n          format\\n          __typename\\n        }\\n        __typename\\n      }\\n      __typename\\n    }\\n  }\\n}\\n\\nfragment summaryFragment on Summary {\\n  __typename\\n  ... on ItemSummary {\\n    ...itemSummaryFragment\\n    __typename\\n  }\\n  ... on ShopSummary {\\n    ...shopSummaryFragment\\n    __typename\\n  }\\n}\\n\\nfragment itemSummaryFragment on ItemSummary {\\n  id\\n  title\\n  media {\\n    id\\n    width\\n    height\\n    title\\n    __typename\\n  }\\n  description\\n  path\\n  distance\\n  distanceUnit\\n  locality\\n  price\\n  originalPrice\\n  currency\\n  ...itemSummaryTagsFragment\\n  canonicalURL\\n  __typename\\n}\\n\\nfragment itemSummaryTagsFragment on ItemSummary {\\n  isNew\\n  isSold\\n  isFree\\n  isOnSale\\n  isLiked\\n  isBoosted\\n  isShippable\\n  isOnHold\\n  __typename\\n}\\n\\nfragment shopSummaryFragment on ShopSummary {\\n  __typename\\n  id\\n  name\\n  avatar {\\n    id\\n    __typename\\n  }\\n  media {\\n    id\\n    __typename\\n  }\\n  itemCount\\n}\\n\\nfragment carouselSummaryFragment on CarouselSummary {\\n  __typename\\n  label\\n  group\\n  items {\\n    id\\n    title\\n    description\\n    media {\\n      id\\n      width\\n      height\\n      title\\n      __typename\\n    }\\n    path\\n    price\\n    originalPrice\\n    currency\\n    ...itemSummaryTagsFragment\\n    canonicalURL\\n    __typename\\n  }\\n}\\n\"}",
        "method": "POST"
      });
      console.log('dere: '+response)
      const responseJSON = await response.json();
      products = responseJSON.data.itemSearch.itemResults[0].items;
      products = mapShpockProducts(products);
    } catch(err) { console.log(err); }
    console.log('before return: '+products);
    return products;
}
  
 
  
function mapShpockProducts(arr) {
    let mapProducts = [];
    arr.forEach(product => {
        mapProducts.push({
        articleNumber: product.id,
        productName: product.title,
        description: product.description,
        price: product.price,
        currency: product.currency,
        link: product.canonicalURL,
        img: 'https://webimg.secondhandapp.at/w-i-mgl/'+product.media[0].id,
        shop: 'Shpock'
        });
    });
    return mapProducts;
}

module.exports = {
    productsShpock
}