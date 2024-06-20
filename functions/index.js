const { onRequest } = require("firebase-functions/v2/https");
const { log } = require("firebase-functions/logger");
require("dotenv").config();

const express = require("express");
const app = express();
const currentDate = new Date();

app.use(express.json());

function grabYear(d) {
  const date = new Date(d);
  return date.getFullYear();
}

async function updateAccount(id, data) {
  const updateYearPosSales = await fetch(
    "https://prod.impartner.live/api/objects/v1/Account/" + id,
    {
      method: "PATCH",
      headers: {
        "X-PRM-TenantId": 864,
        Authorization: "prm-key " + process.env.PROD_API,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  return updateYearPosSales.json();
}
//receive Id from post and make a fetch request to get sales based on those accounts
app.post("/", async (req, res) => {
  const id = req.body.id;
  const costByYear = { Id: id, PartnerLevel: 0, name: "" };
  const query = `fields=SourceAccount.PartnerLevel%2CSourceAccount.Name%2CSourceAccount%2CInvoiceDate%2CReseller_Extended_Cost__cf&filter=InvoiceDate%3E%22${(
    currentDate.getFullYear() - 1
  ).toString()}-12-31T00%3A00%3A00%22%20and%20SourceAccount.Id%20%3D%20${id}&take=1000`;
  const response = await fetch(
    `https://prod.impartner.live/api/objects/v1/Sale?${query}`,
    {
      method: "GET",
      headers: {
        "X-PRM-TenantId": 864,
        Authorization: "prm-key " + process.env.PROD_API,
      },
    }
  );

  if (response.ok) {
    const results = await response.json();
    const sales = results.data.results;
    await sales.forEach((sale) => {
      const { invoiceDate, reseller_Extended_Cost__cf } = sale;

      costByYear.name = sale.sourceAccount.name;
      costByYear.PartnerLevel = sale.sourceAccount.partnerLevelId;

      if (!costByYear[`POS_${grabYear(invoiceDate)}__cf`]) {
        costByYear[`POS_${grabYear(invoiceDate)}__cf`] = 0;
      }

      costByYear[`POS_${grabYear(invoiceDate)}__cf`] +=
        reseller_Extended_Cost__cf;
    });
    await updateAccount(id, costByYear).then((r) => {
      log(r);
      res.send(r);
    });
  } else {
    log(response.statusText);
    res.send("response status " + response.statusText);
  }
});

//Using one below for stage only
// exports.updateCalculation = onRequest(app);

exports.prodUpdateCalculation = onRequest({ secrets: ["PROD_API"] }, app);
