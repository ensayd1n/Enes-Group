const axios = require('axios');
require('dotenv').config();

const apiKey= process.env.EXCHANGE_API_KEY;
const apiUri= process.env.EXCHANGE_API_URL;

async function fetchExchangeRateData(){
    try{
        const response = await axios.get(process.env.EXCHANGE_API_URL,{
            headers: {
                'Authorization': `Bearer ${process.env.EXCHANGE_API_KEY}`
            }
        });
        const rates = response.data.conversion_rates;
        const selectedCurrencies = {
            USD: rates.USD,
            TRY: rates.TRY,
            EUR: rates.EUR,
            RUB: rates.RUB,
            CNY: rates.CNY
        };
        return selectedCurrencies;
    }catch{
        console.error('Currency api request failed.');
        return null;
    }
}
module.exports = { fetchExchangeRateData };
