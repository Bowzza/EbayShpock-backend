const User = require('./model/User');
const puppeteer = require('puppeteer');
const { sendNotifications } = require('./sendNotification');


module.exports = async () => {
    console.log('Check prices!');
    const users = await User.find();
    if(users.length === 0) return;
    let changedProduct = false;
    for(const user of users) {
        if(!user.notifyEnabled || user.notifyProducts.length === 0) return;
        for (const product of user.notifyProducts) {
            if(product.shop === 'Ebay') {
                try {
                    const price = await scrapEbayProduct(product);
                    if(price !== product.price) {
                        changedProduct = true;
                        product.price = price;
                        sendNotifications(user, product, price);
                    }
                } catch (err) { console.log(err); }
            } else {
                try {
                    const price = await scrapShpockProduct(product);
                    if(price !== product.price) {
                        changedProduct = true;
                        product.price = price;
                        sendNotifications(user, product, price);
                    }
                } catch (err) { console.log(err); }
            }
        }
        updateWishlistProducts(user.notifyProducts, user.wishlist);
        if(changedProduct) {
            try {
                await user.save();
            } catch(err) { console.log(err); }
        }
        changedProduct = false;
    }
}

function scrapEbayProduct(product) {
    return new Promise(async (resolve, reject) => {
        try {
            const browser = await puppeteer.launch({
                args: [
                  '--no-sandbox',
                  '--disable-setuid-sandbox',
                ],
                ignoreDefaultArgs: ['--disable-extensions']
              });
            const page = await browser.newPage();
            await page.goto(product.link);
            const content = await page.evaluate(() => {
                let price = document.querySelector('.notranslate').textContent;
                price = price.replace('EUR','');
                try {
                    price = price.replace('.', '');
                    price = price.replace(',', '.');
                } catch(e) {}
                price = parseFloat(price);
                return price;
            });
            await browser.close();
            return resolve(content);
        } catch (err) { return reject(err.message); }
    });
}

function scrapShpockProduct(product) {
    return new Promise(async (resolve, reject) => {
        try {
            const browser = await puppeteer.launch({
                args: [
                  '--no-sandbox',
                  '--disable-setuid-sandbox',
                ],
                ignoreDefaultArgs: ['--disable-extensions']
              });
            const page = await browser.newPage();
            await page.goto(product.link);
            const content = await page.evaluate(() => {
                let price = document.querySelector('.dqsfyh').textContent;
                try {
                    price = price.split('€')[1].trim();
                    price = price.replace('.', '');
                    price = price.replace(',', '.');
                } catch(e) {}
                price = parseFloat(price);
                return price;
            });
            await browser.close();
            return resolve(content);
        } catch (err) { return reject(err.message); }
    });
}

function updateWishlistProducts(notifyProductlist, wishlist) {
    notifyProductlist.forEach(notifyProduct => {
        wishlist.forEach(wishlistProduct => {
            if(notifyProduct.articleNumber === wishlistProduct.articleNumber && notifyProduct.price !== wishlistProduct.price) {
                wishlistProduct.price = notifyProduct.price;
            }
        });
    });
}
