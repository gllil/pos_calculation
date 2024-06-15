import salesJson from "./sales.js";

function grabYear(date) {
  return date.split("-")[0];
}

function remappedSaleObject(data) {
  console.log(data);
  const sales = data.data.results?.filter(
    (sale) => sale.sourceAccount.name !== null
  );
  //   sales.forEach((sale) => console.log(sale));
  return sales.map((sale) => ({
    name: sale.sourceAccount.name,
    year: grabYear(sale.invoiceDate),
    amount: sale.reseller_Extended_Cost__cf,
  }));
}
function sumOfCostByAccount(salesData) {
  console.log(salesData);
  const costByAccount = {};
  salesData.forEach((company) => {
    const { name, year, amount } = company;

    if (!costByAccount.name) {
      costByAccount[name] = {};
    }

    if (!costByAccount[name][year]) {
      costByAccount[name][year] = 0;
    }

    costByAccount[name][year] += amount;
  });

  return costByAccount;
}

const salesReduced = remappedSaleObject(salesJson);
console.log(remappedSaleObject(salesJson));
console.log(sumOfCostByAccount(salesReduced));
