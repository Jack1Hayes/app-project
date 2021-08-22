//mongodb
require('./config/DB');

const app = require('express')();
const port = process.env.PORT || 3000;
const cors = require('cors');
app.use(cors);

const UserRouter = require('./api/User')

//for accepting post form data

const bodyParser = require('express').json;
app.use(bodyParser());

app.use('/user', UserRouter)

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
})