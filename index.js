const { BigQuery } = require('@google-cloud/bigquery');
const bigquery = new BigQuery();

const cheerio = require('cheerio')
const axios = require("axios");

const date = new Date();
const dateString = date.toISOString().slice(0,10);

const fetchData = async (siteUrl) => {
    const result = await axios.get(siteUrl);
    return cheerio.load(result.data);
};

const getMeps = async () => {
    const siteUrl = "https://www.eduskunta.fi/FI/kansanedustajat/nykyiset_kansanedustajat/Sivut/default.aspx";

    const $ = await fetchData(siteUrl);
    const mainBlocks = $('#maincontent div.ms-webpart-zone > div[id^="MSOZoneCell_WebPart"]');

    console.log(`district blocks found ${mainBlocks.length}`);

    const mepsFetched = [];
    mainBlocks.each((i, block) => {
        const blockEl = $(block);
        const h2 = blockEl.find('h2').text();
        if (typeof h2 === 'string' && h2.indexOf('vaalipiiri') > -1) {
            const electoralDistrict = h2.replace(/\s\(.*/, '');
            console.log(electoralDistrict);

            const meps = blockEl.find('table tbody tr');
            //console.log(blockEl.html());
            meps.each((j, mep) => {
                const link = $(mep).find('a');
                const linkUrl = link.attr('href');
                const name = link.text();
                const party = $(mep).find('td').eq(5).text();

                const mepObj = {
                    date: dateString,
                    name: name,
                    party: party,
                    url: linkUrl
                };

                mepsFetched.push(mepObj);
            });
        }
    });

    console.log(mepsFetched);
}

getMeps()