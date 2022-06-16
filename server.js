// mongodb
require("./config/DB");

const app = require("express")();
const port = process.env.PORT || 5000;



const UserRouter = require("./api/User");

// For accepting post form data
const bodyParser = require("express").json;
app.use(bodyParser());

//cors
const cors = require("cors");
app.use(cors());

app.use("/User", UserRouter);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});