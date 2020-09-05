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
    const mainBlocks = $('#maincontent div.ms-webpart-zone > div[id^="MSOZoneCell_WebPart"]');

    const mepsFetched = [];
    mainBlocks.each((i, block) => {
        const h2 = $(block).find('h2').html();
        console.log(h2);
        if (typeof h2 === 'string') {
            console.log(h2);
        }
    });
}

getMeps()