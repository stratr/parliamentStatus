const { BigQuery } = require('@google-cloud/bigquery');
const bigquery = new BigQuery();
const dataset = bigquery.dataset('meps');
const table = dataset.table('meps_daily');

const cheerio = require('cheerio')
const axios = require("axios");

const date = new Date();
const dateString = date.toISOString().slice(0, 10);

/*
Test commands:
node -e 'require("./index").parliamentStatus()'

Deploy:
// gcloud functions deploy parliamentStatus --runtime nodejs10 --trigger-topic parliament_status --timeout 180s
*/

const fetchData = async (siteUrl) => {
    const result = await axios.get(siteUrl);
    return cheerio.load(result.data);
};

exports.parliamentStatus = async (event) => {
    let eventPayload = null;
    if (event) {
        // function could be updated to get more config parameters from the pubsub event
        // that way it would be possible to use the same function for multiple jobs
        eventPayload = JSON.parse(Buffer.from(event.data, 'base64').toString());
        console.log(`Payload of the triggering event: ${JSON.stringify(eventPayload)}`);
    }

    // scrape eduskunta.fi and store the data into BigQuery
    await getMeps();
}

function insertRowsAsStream(rows, table) {
    // insert options, raw: true means that the same rows format is used as in the API documentation
    const options = {
        raw: true,
        allowDuplicates: false
    };

    return table.insert(rows, options);
}

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
            //console.log(electoralDistrict);

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

    var bqRows = mepsFetched.map(mep => {
        return {
            "insertId": mep.date + mep.name ,
            "json": mep
        }
    });

    //console.log(bqRows);

    return insertRowsAsStream(bqRows, table)
        .then(response => {
            console.log(JSON.stringify(response));
            console.log('Fetching meps completed');
        })
        .catch((err) => {
            // An API error or partial failure occurred.
            console.log(JSON.stringify(err));
        });
}