
const { getPrayerCampaigns } = require('./services/db');
require('dotenv').config();

async function check() {
    try {
        const campaigns = await getPrayerCampaigns();
        console.log("Campaigns:", JSON.stringify(campaigns, null, 2));
    } catch (e) {
        console.error(e);
    }
}

check();
