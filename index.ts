const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())
import  { Browser } from 'puppeteer';
const fs = require('fs');
var cron = require('node-cron');
var nodemailer = require('nodemailer');





const url = "https://www.runningwarehouse.com/Nike_Mens_Running_Shoes/catpage-MRSNIKE.html"

interface Shoe{
    shoeUrl: string;
    showImage: string;
    shoeName: string;
    shoePrice: string;

}

interface ShoeDiffrence{
    shoeUrl: string;
    showImage: string;
    shoeName: string;
    shoePrice: string;
    priceDiff: number;


}

    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'crosvelucero@gmail.com',
          pass: 'fijz mlcu indb kebb'
        }
      });
    
      
    
    







const compareData = (previousData: string, newData: string) => {
    const previousShoes = JSON.parse(previousData);
    const newShoes = JSON.parse(newData);
    const comparisonResult : ShoeDiffrence []= []; 

  
    for (const prevShoe of previousShoes) {
        const matchingNewShoe = newShoes.find((newShoe: Shoe)  => newShoe.shoeName === prevShoe.shoeName);

        if (matchingNewShoe) {
            const prevPrice = parseFloat(prevShoe.shoePrice.replace('$', ''));
            const newPrice = parseFloat(matchingNewShoe.shoePrice.replace('$', ''));
            const priceDiff = newPrice - prevPrice;
            let comparison: string = "";

            if (priceDiff > 0) {
                comparison = "increased";
            } else if (priceDiff < 0) {
                comparison = "decreased";
                comparisonResult.push({
                    shoeUrl: matchingNewShoe.shoeUrl,
                    showImage: matchingNewShoe.showImage,
                    shoeName: matchingNewShoe.shoeName,
                    shoePrice: matchingNewShoe.shoePrice,
                    priceDiff: priceDiff
    
                });
            } else {
                comparison = "remained the same";
            }

            
            

          
        }
    }

    return comparisonResult;


    

}

//schedule every day at 10am

cron.schedule('* * * * Friday', () => {
    const main = async() =>{
    const broswer : Browser = await puppeteer.launch({headless: true});  //launch a broswer for puppeteer
    const page = await broswer.newPage();                       //open a new page 
    await page.goto(url);                                       //go to the specified url
 

    const evalute = await page.evaluate((url : any) =>{
        const text = document.querySelector('.check_read-inner p'); //select all the shoes
        let readableText = text?.textContent; //get the text content of the shoes

        const shoesData = Array.from(document.querySelectorAll(".cattable-wrap-cell.gtm_impression"));
        console.log(shoesData);
        console.log('hey')

        const data = shoesData.map((shoeinfo: any) => ({
            shoeUrl: shoeinfo.querySelector('.cattable-wrap-cell-imgwrap a')?.getAttribute('href'),
            showImage: shoeinfo.querySelector('.cattable-wrap-cell-imgwrap a img')?.getAttribute('src'),
            shoeName: shoeinfo.querySelector(".cattable-wrap-cell-info .cattable-wrap-cell-info-name").innerText,
            shoePrice: shoeinfo.querySelector(".cattable-wrap-cell-info .cattable-wrap-cell-info-price span").innerText,
        }))

        return data;

    }, [url])

    const previousData = fs.readFileSync('nikeShoes.json', 'utf8');
    const previousShoes = JSON.parse(previousData); 
    const diffrence = compareData(previousData, JSON.stringify(evalute));
    if(diffrence.length === 0){
      console.log('No price changes')
  

    }
    else{
      //set the email information
      var mailOptions = {
        from: 'crosvelucero@gmail.com',
        to: '03adrianguillermo@gmail.com, crosvelucero@gmail.com',
        subject: 'Shoe Price Decrease',
        text: diffrence.map((shoe: ShoeDiffrence) => `${shoe.shoeName} has decreased by $${Math.abs(shoe.priceDiff)} link: ${shoe.shoeUrl}`).join('\n')
      };

      transporter.sendMail(mailOptions, function(error : Error, info : any){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });


        fs.writeFile('nikeShoes.json', JSON.stringify(evalute), (err: any)=>{
        if(err) throw err; 
        console.log('Data has been written to data.json')

    })


    }

    

    



    await broswer.close(); //close the browser

    

}

main(); 

});



