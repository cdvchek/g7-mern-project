const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');

const envName = process.env.PLAID_ENV || 'sandbox';
const config = new Configuration({
  basePath: PlaidEnvironments[envName],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

const plaid = new PlaidApi(config);
module.exports = { plaid };
