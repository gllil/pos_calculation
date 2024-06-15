const express = require("express");
const app = express();

app.use(express.json());

const salesCalculationsRouter = require("./routes/salesCalculations");
app.use("/calculations", salesCalculationsRouter);

app.listen(3000, () => console.log("server 3000 has started"));
