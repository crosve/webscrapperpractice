const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const fs = require('fs');
const cron = require('node-cron');
const nodemailer = require('nodemailer');

const url = "https://www.runningwarehouse.com/Nike_Mens_Running_Shoes/catpage-MRSNIKE.html";

// Define interfaces for Shoe and ShoeDifference
interface Shoe {
    shoeUrl: string;
    showImage: string;
    shoeName: string;
    shoePrice: string;
}

interface ShoeDifference {
    shoeUrl: string;
    showImage: string;
    shoeName: string;
    shoePrice: string;
    priceDiff: number;
}

// Create nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'crosvelucero@gmail.com',
        pass: 'fijz mlcu indb kebb'
    }
});

// Function to compare shoe data
const compareData = (previousData: string, newData: string) => {
    const previousShoes = JSON.parse(previousData);
    const newShoes = JSON.parse(newData);
    const comparisonResult: ShoeDifference[] = [];

    for (const prevShoe of previousShoes) {
        const matchingNewShoe = newShoes.find((newShoe: Shoe) => newShoe.shoeName === prevShoe.shoeName);

        if (matchingNewShoe) {
            const prevPrice = parseFloat(prevShoe.shoePrice.replace('$', ''));
            const newPrice = parseFloat(matchingNewShoe.shoePrice.replace('$', ''));
            const priceDiff = newPrice - prevPrice;

            if (priceDiff !== 0) { // Only push if there's a price difference
                comparisonResult.push({
                    shoeUrl: matchingNewShoe.shoeUrl,
                    showImage: matchingNewShoe.showImage,
                    shoeName: matchingNewShoe.shoeName,
                    shoePrice: matchingNewShoe.shoePrice,
                    priceDiff: priceDiff
                });
            }
        }
    }

    return comparisonResult;
};

// Schedule the task to run every day at 10am
cron.schedule('0 10 * * *', async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url);

    const evaluate = await page.evaluate(() => {
        const shoesData = Array.from(document.querySelectorAll(".cattable-wrap-cell.gtm_impression"));
        return shoesData.map((shoeinfo: any) => ({
            shoeUrl: shoeinfo.querySelector('.cattable-wrap-cell-imgwrap a')?.getAttribute('href'),
            showImage: shoeinfo.querySelector('.cattable-wrap-cell-imgwrap a img')?.getAttribute('src'),
            shoeName: shoeinfo.querySelector(".cattable-wrap-cell-info .cattable-wrap-cell-info-name").innerText,
            shoePrice: shoeinfo.querySelector(".cattable-wrap-cell-info .cattable-wrap-cell-info-price span").innerText,
        }));
    });

    const previousData = fs.readFileSync('nikeShoes.json', 'utf8');
    const difference = compareData(previousData, JSON.stringify(evaluate));

    if (difference.length === 0) {
        console.log('No price changes');
    } else {
        const mailOptions = {
            from: 'crosvelucero@gmail.com',
            to: '03adrianguillermo@gmail.com, crosvelucero@gmail.com',
            subject: 'Shoe Price Decrease',
            text: difference.map((shoe: ShoeDifference) => `${shoe.shoeName} has decreased by $${Math.abs(shoe.priceDiff)} link: ${shoe.shoeUrl}`).join('\n')
        };

        transporter.sendMail(mailOptions, (error: Error, info: any) => {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });

        fs.writeFile('nikeShoes.json', JSON.stringify(evaluate), (err: any) => {
            if (err) throw err;
            console.log('Data has been written to nikeShoes.json');
        });
    }

    await browser.close();
});
