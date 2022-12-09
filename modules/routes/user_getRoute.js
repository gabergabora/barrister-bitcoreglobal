const { format, isValid, differenceInHours, differenceInDays, subDays } = require("date-fns")
const express = require("express")
const user_getRoute = express.Router()
const ADMIN = require("../adminDB")
const { TRANSACTION, SHORTINVS, } = require("../userDB")

const isAuth = function(req,res, next){
    if(!req.isAuthenticated()){
       return res.redirect("/login")
    }
    res.locals.reqUrl = req.url
    res.locals.user = req.user
    res.locals.format = format
    res.locals.difference = differenceInDays
    res.locals.sub = subDays
    return next() 
}
const getInvestments = function(req,res, next){
     return ADMIN.findOne({}, function(err, data){
        if(err) return res.send("an error occured on the server, please report this problem")
        res.locals.accounts = data.accounts
        res.locals.normalInvestments = data.normalInvestments
        res.locals.cyclesInvestment = data.cyclesInvestment
        return next()
    })
}

const getTransactions = function(req,res,next){
    return TRANSACTION.find({email : req.user.email}, function(err, data){
        if(err){
            console.log(err.message)
            return res.send("an error occured on the server, please report this problem")
        }
        res.locals.transactions = data
        next()
    })
}
const userProfits = async function(req,res,next){
    try{
        res.locals.shorts = await SHORTINVS.findOne({user : req.user._id, paid : false})
       return next()
    }catch(err){
       return res.send('error trying to get profits')
    }

}

user_getRoute.get("/login", function(req,res){
    if(req.isAuthenticated()){
        return res.redirect("/dashboard")
    }
    return res.render("login")
 })

 
user_getRoute.get("/register", function(req,res){
    if(req.isAuthenticated()){
        return res.redirect("/dashboard")
    }
    return  res.render("register")
})

user_getRoute.get("/register/:id", function(req,res){
    if(req.isAuthenticated()){
        return res.redirect("/dashboard")
    }
    return  res.render("register")
})

user_getRoute.get("/dashboard",isAuth,userProfits, function(req,res){
    res.render("dashboard")
})

user_getRoute.get("/invest",isAuth, getInvestments, function(req,res){
    res.render("invest")
})

user_getRoute.get("/deposit",isAuth,getInvestments, function(req,res){
    res.render("deposit")
})

user_getRoute.get("/transfer",isAuth, function(req,res){
    res.render("transfer")
})

user_getRoute.get("/withdraw",isAuth, function(req,res){
    res.render("withdraw")
})

user_getRoute.get("/history",isAuth, getTransactions, function(req,res){
    res.render("transactions")
})

// user_getRoute.get("/loan",isAuth, function(req,res){
//     res.render("loan")
// })

user_getRoute.get("/account",isAuth, function(req,res){
    res.render("account")
})

user_getRoute.get("/logout",isAuth, function(req,res){
    req.logout()
    res.redirect("/login")
})

user_getRoute.get("/changepassword/:timestamp/:id", function(req,res){
    const timestamp = Number(req.params.timestamp)
    // if timestamp is valid, if it is less than or greater than current timestamp by 24 hours link is broken
    if(!isValid(timestamp) || differenceInHours(timestamp, new Date()) < 0 || differenceInHours(timestamp, new Date()) > 24){
        return res.send('This link has expired or is invalid...')
    }
    res.locals.id = req.params.id
    return res.render("changepass")
})

module.exports = {user_getRoute, getInvestments}