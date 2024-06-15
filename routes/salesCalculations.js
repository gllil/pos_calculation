const express = require("express");
const router = express.Router();
require("dotenv").config();

function grabYear(date) {
  return date.split("-")[0];
}

async function updateAccount(id, data) {
  const updateYearPosSales = await fetch(
    "https://stage.impartner.live/api/objects/v1/Account/" + id,
    {
      method: "PATCH",
      headers: {
        "X-PRM-TenantId": 864,
        Authorization: "prm-key " + process.env.API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  return updateYearPosSales.json();
}
//receive Id from post and make a fetch request to get sales based on those accounts
router.post("/", async (req, res) => {
  const id = req.body.id;
  const costByYear = { Id: id, PartnerLevel: 0, name: "" };

  const response = await fetch(
    `https://stage.impartner.live/api/objects/v1/Sale?fields=SourceAccount.PartnerLevel%2CSourceAccount.Name%2CSourceAccount%2CInvoiceDate%2CReseller_Extended_Cost__cf&filter=SourceAccount.Id%20%3D%20${id}&take=1000`,
    {
      method: "GET",
      headers: {
        "X-PRM-TenantId": 864,
        Authorization: "prm-key " + process.env.API_KEY,
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
    console.log(costByYear);
    await updateAccount(id, costByYear).then((r) => res.send(r));
  } else {
    res.send("response status" + response.statusText);
  }
});

module.exports = router;
