const axios = require('axios');
const cheerio = require('cheerio');
const nodemailer = require('nodemailer');

const url =
  'https://www.roguefitness.com/weightlifting-bars-plates/bumpers?cat3%5B0%5D=bumperplates_id_4683&is_salable=1';

const transportOptions = {
  service: 'gmail',
  auth: {
    user: '',
    pass: '',
  },
};

let mailOptions = {
  from: {
    name: 'James Wilson',
    address: '',
  },
  to: '',
};

let lastInStock = [];

function run() {
  const date = new Date();
  const timestamp = `${date.getHours()}:${date.getMinutes()}`
  let currentInStock = [];

  axios
    .request({
      url,
      method: 'get',
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    })
    .then((resp) => {
      const $ = cheerio.load(resp.data);
      const products = $('.products-grid li');

      if (products.length) {
        const output = products
          .map(i => {
            const name = $(products[i]).find('.product-name a').text();

            currentInStock.push(name);
            if (!lastInStock.includes(name)) {
              return `<li>${name}</li>`;
            }
          })
          .get()
          .join('');

        lastInStock = currentInStock;

        if (output.length) {
          const transporter = nodemailer.createTransport(transportOptions);
          mailOptions.subject = `${products.length} rogue bumper plates in stock`;
          mailOptions.html = `<h2>There are ${products.length} new items in stock.</h2><p><a href="${url}" target="_blank">${url}</p><ul>${output}</ul>`;
          transporter.sendMail(mailOptions, (err, info) => {
            const status = err
              ? { text: 'Error sending email', desc: err }
              : { text: 'Success', desc: info };
            console.log(`${timestamp} - ${status.text}`, status.desc);
          });
        } else {
          console.log(`${timestamp} - No new products found (${lastInStock.length} last run, ${currentInStock.length} this run)`)
        }
      } else {
        console.log(`${timestamp} - No products found`);
      }
    })
    .catch((err) => {
      console.log(`${timestamp} - Error fetching website information`, err);
    });
}

run();
setInterval(run, 60000 * 10); // 10 minutes
// setInterval(run, 15000);