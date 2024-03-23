const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())
import  { Browser } from 'puppeteer';
const fs = require('fs');

const url = "https://www.runningwarehouse.com/mens-running-shoes.html"



const main = async() =>{
    const broswer : Browser = await puppeteer.launch({headless: true});  //launch a broswer for puppeteer
    const page = await broswer.newPage();                       //open a new page 
    await page.goto(url);                                       //go to the specified url
 

    const evalute = await page.evaluate((url : any) =>{
        const text = document.querySelector('.check_read-inner p'); //select all the shoes
        let readableText = text?.textContent; //get the text content of the shoes

        const shoesData = Array.from(document.querySelectorAll(".cattable-wrap-cell.gtm_impression"));

        const data = shoesData.map((shoeinfo: any) => ({
            shoeUrl: shoeinfo.querySelector('.cattable-wrap-cell-imgwrap a')?.getAttribute('href'),
            showImage: shoeinfo.querySelector('.cattable-wrap-cell-imgwrap a img')?.getAttribute('src'),
            shoeName: shoeinfo.querySelector(".cattable-wrap-cell-info .cattable-wrap-cell-info-name").innerText,
            shoePrice: shoeinfo.querySelector(".cattable-wrap-cell-info .cattable-wrap-cell-info-price span").innerText,
        }))

        return data;

    }, [url])

    // console.log(evalute); 


    await broswer.close(); //close the browser

    fs.writeFile('data.json', JSON.stringify(evalute), (err: any)=>{
        if(err) throw err; 
        console.log('Data has been written to data.json')

    })


}

main(); 