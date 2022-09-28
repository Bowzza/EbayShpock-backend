const axios = require('axios');
const cheerio = require('cheerio');
const Promise = require('promise');
const client = require('../elastic_connection');
const puppeteer = require('puppeteer');



function productsEbay(product, page) {
  let content = []
  return new Promise((resolve, reject) => {
    try {
      const website = 'https://www.ebay.de/sch/i.html?_from=R40&_nkw='+product+'&_sacat=0&_pgn='+page;
        axios(website).then((res) => {
          const data = res.data;
          const $ = cheerio.load(data);
      
          $('.s-item', data).each(function () {
            const item = $(this).find('.s-item__wrapper');
            
            const imgWrapper = item.find('.s-item__image-section');
            const img = imgWrapper.find('img').attr('src');
    
            const itemInfo = item.find('.s-item__info');
    
            const productName = itemInfo.find('.s-item__title').text().trim();

            const description = itemInfo.find('.s-item__subtitle').text();
            let price = itemInfo.find('.s-item__price').text();
            const currency = price.includes('EUR') ? 'EUR' : '$';
            price = price.replace('EUR','');
            try {
              // if(price.charAt(price.length-2) == '0') price = price.replace('.', '');
              price = price.replace('.', '');
              price = price.replace(',', '.');
          } catch(e) {}
            price = parseFloat(price);
            const link = itemInfo.find('a').attr('href');
            const articleNumber = link.split('/')[4].split('?')[0];
            let inResult = false;
            content.forEach(item => { 
              if(item.articleNumber === articleNumber) inResult = true;
            });
            if(productName === 'Shop on eBay') inResult = true;
            if(!inResult) {
              content.push({
                articleNumber,
                productName,
                description,
                price,
                currency,
                link,
                img,
                shop: 'Ebay'
              });
            }
          });
          try {
            return resolve(content);
          } catch(err) {
            reject(err);
          }
        })
      } catch (error) {
        console.log(error.message);
      }
  });
}

async function saveMoreProductsEbay(product) {
  let saveProducts = [];
  for(let i = 2; i <= 10; i++) {
    saveProducts = await productsEbay(product, i);

    for(const product of saveProducts) {
      await client.index({
          index: 'ebay',
          body: {
              articleNumber: product?.articleNumber,
              productName: product?.productName,
              description: product?.desription,
              price: product?.price,
              link: product?.link,
              img: product?.img,
              shop: product.shop
          }
      });
  }
  }
}



function scrapEbayPage(product, pageNumber) {
  return new Promise(async (resolve, reject) => {
      try {
          const browser = await puppeteer.launch({
              args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
              ],
              ignoreDefaultArgs: ['--disable-extensions'],
              waitUntil: 'domcontentloaded'
            });
          const page = await browser.newPage();
          await page.goto('https://www.ebay.de/sch/i.html?_from=R40&_nkw='+product+'&_sacat=0&_pgn='+pageNumber);
          await page.screenshot({
            path: "hollo.png",
            fullPage: true
          });
          // await page.waitForSelector('button.pCoNC');
          await page.waitForSelector('li.s-item');
          // await page.click('button.pCoNC')[1];

          // await page.screenshot({ path: 'screenshot.png' });
          // await page.waitForSelector('.ldbLmI');
          // await page.waitForSelector('.dnQQkK');
          // await page.waitForSelector('.bukxj');

          // let content = await page.$eval('.bukxjJ', el => el.innerHTML);
          let content = await page.evaluate(() => {
              let results = [];
              let products = document.querySelectorAll('.s-item');
              products.forEach((product) => {
                const item = product.querySelector('.s-item__wrapper');
            
                const imgWrapper = item.querySelector('.s-item__image-section');
                const img = imgWrapper.querySelector('img').getAttribute('src').valueOf();
        
                const itemInfo = item.querySelector('.s-item__info');
        
                const productName = itemInfo.querySelector('.s-item__title').textContent;
                const description = itemInfo.querySelector('.s-item__subtitle').textContent;
                let price = itemInfo.querySelector('.s-item__price').textContent;
                price = price.replace('EUR','');
                try {
                  // if(price.charAt(price.length-2) == '0') price = price.replace('.', '');
                  price = price.replace('.', '');
                  price = price.replace(',', '.');
              } catch(e) {}
                price = parseFloat(price);
                const link = itemInfo.querySelector('a').getAttribute('href').valueOf();
                const articleNumber = link.split('/')[4].split('?')[0];
                let inResult = false;
                results.forEach(item => {
                    if(item.articleNumber === articleNumber || productName === 'Shop on Ebay') {
                      inResult = true;
                      // console.log(item.articleNumber+' '+articleNumber);
                      // console.log(item.productName+' '+productName);
                  }
                });
                if(!inResult) {
                  results.push({
                    articleNumber,
                    productName,
                    description,
                    price,
                    link,
                    img,
                    shop: 'Ebay'
                  });
                }
              });
              return results;
          });
          await browser.close();
          return resolve(content);
      } catch (e) {
          return reject(e.message);
      }
  });
}



module.exports = {
  productsEbay,
  saveMoreProductsEbay,
  scrapEbayPage
}

// async function testMe() {
//   const products = await productsEbay('notebook', 0);
//   console.log(products.length);
// }

// testMe();