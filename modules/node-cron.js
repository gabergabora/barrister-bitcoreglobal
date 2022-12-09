// const cron = require('node-cron')
// const { transporter, Message } = require('./nodemailer')
const {USER, SHORTINVS, CYCLESINVS} = require('./userDB')
// require('dotenv').config()

const ADMIN = require("./adminDB")


/*
    (-NOTED-)
HEROKU APPS GO TO SLEEP AFTER 30 MINS OF INACTIVITY, THIS IS TO PRESERVE THEIR 
THIS IS TO PRESERVE THEIR 550 DYNO HOURS GIVEN TO FREE TIER, WHEN THE HEROKU APP
SLEEPS, THE CRON-JO FUNCTION WOULD NOT RUN, AN EASY WAY WOULD BE TO HAVE AN APP SOMEWHERE
THAT AT INTERVALS IT RUNS A GET REQUEST TO MY SITE BUT THAT WOULD ALSO WASTE THE DYNO HOURS
    (-----)
*/


// This owner wants daily profits
// the idea would be to calculate the amount of profit to be paid
// to customers in the front-end and only officially pay/update the DB during expiry
const updateShortPayment = async function(){
    let readyDocs = await SHORTINVS.find({expiry : {$lt : new Date().getTime()}, paid : false})
    for(i = 0; i < readyDocs.length; i++){
        await SHORTINVS.updateOne({_id : readyDocs[i]._id}, {paid : true})
        await USER.updateOne({_id : readyDocs[i].user}, {
            $inc : {shortBallance : readyDocs[i].profit * readyDocs[i].duration + readyDocs[i].amount},
            $push : {activities :  {
                type : "credit",
                from : readyDocs[i].title,
                amount : readyDocs[i].profit + readyDocs[i].amount,
            }}
        })
    }
}

module.exports = {updateShortPayment}
