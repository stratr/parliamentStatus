const { BigQuery } = require('@google-cloud/bigquery');
const bigquery = new BigQuery();

const cheerio = require('cheerio')
const axios = require("axios");

const fetchData = async (siteUrl) => {
    const result = await axios.get(siteUrl);
    return cheerio.load(result.data);
};

const getMeps = async () => {
    const siteUrl = "https://www.eduskunta.fi/FI/kansanedustajat/Sivut/Kansanedustajat-aakkosjarjestyksessa.aspx";

    const $ = await fetchData(siteUrl);
    const mainBlocks = $('#maincontent div.ms-webpart-zone.ms-fullWidth > div[id^="MSOZoneCell_WebPart"');
    

    const linkItems = $('#maincontent #WebPartWPQ2 div.link-item'); // the elements that contain mep details
    
    console.log(linkItems);
}

getMeps()