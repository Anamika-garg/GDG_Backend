const express = require('express');
const app = express();

require('dotenv').config();

app.get('/' , (req,res,next)=>{
    res.send("Hello,world");
})

app.listen(process.env.PORT || 3000 , ()=>{
    console.log("example app listening on port 3000")
})