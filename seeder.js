
let localhost = "mongodb://127.0.0.1:27017/temenosG";
const mongoose = require("mongoose")
mongoose.connect(localhost, function (req, res) {
  console.log("DB connected successfully");
});
const  md5 = require('md5')

const ADMIN = require('./modules/adminDB')


const admin = {
    name : "Barrister",
    username : "barristerone",
    password : md5("1234"),
    admin : true,
    accounts : [{ title : "bitcoin", address : 'fihybwf9743r79-38000'},
    {title : "etherium", address : "whiybowrcipwbrupownr98h98hnuogu9n"}
],
    normalInvestments : [
        {
            title : "Starter Plan",
            roi :4,
            duration : 5,
            min : 60,
            max : 599,
        },
        {
            title : "Premium Plan",
            roi :6,
            duration : 5,
            min : 600,
            max : 1999
        },
        {
            title : "Super Plan",
            roi : 8,
            duration : 4,
            min : 2000,
            max : 4999
        },
        {
            title : "Professional Plan",
            roi :11,
            duration : 6,
            min : 5000,
            max : 9999
        },
        {
            title : "Exotic Plan",
            roi :14,
            duration : 7,
            min : 10000,
            max : 14999
        },
        {
            title : "Covid-19 Plan",
            roi :45,
            duration : 20,
            min : 15000,
            max : 100000
        }
    ]
}

ADMIN.create(admin)
.then((d,e)=> console.log(d, e))