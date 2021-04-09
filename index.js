const express = require("express");
const app = express();
const dotenv = require('dotenv');
const mongoose = require('mongoose');
//import Routes
const authRoute = require('./routes/auth');

dotenv.config();

//Connect to DB
mongoose.connect(process.env.DB_CONNECT, {
    useNewUrlParser: true, 
    useUnifiedTopology: true, 
    useFindAndModify: false, 
    useCreateIndex: true 
  }
  )
  .then(() => {
      console.log("ok")
  })
  .catch(err => {
      console.log(err)
});
 

//Middleware
app.use(express.json());

//Route Middlewares
app.use('/auth', authRoute);

app.listen(3000, () => console.log('Server Up and running'));
