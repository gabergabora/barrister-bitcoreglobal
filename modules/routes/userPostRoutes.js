const express = require("express");
const router = express.Router();
const passport = require("passport");
const upload = require("../multer").single("receipt");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { addDays, addHours, getTime ,differenceInHours } = require("date-fns");

// local modules
const { USER, TRANSACTION, SHORTINVS } = require("../userDB");
const showError = require("../error.js");
const ADMIN = require("../adminDB");
const { getInvestments } = require("./user_getRoute");
var cloudinary = require("cloudinary").v2;
const { transporter, Message } = require("../nodemailer");
const welcome = require("../email-templates/welcome");
const { depositRequest } = require("../email-templates/deposit");
const { withdrawRequest } = require("../email-templates/withdraw");
const {ChangedPasswordSuccessfully, requestChangePassword} = require("../email-templates/deposits&withdraw")

// cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
  secure: true,
});

router.use(express.urlencoded({ extended: true }));
const isAuth = function (req, res, next) {
  if (!req.isAuthenticated()) {
    return res.redirect("/login");
  }
  return next();
};

router.post(
  "/register",
  function (req, res, next) {
    USER.findOne({ email: req.body.email }).then((user) => {
      if (user) {
        return showError(req, "/register", "this email isn't available", res);
      } else {
        req.body.email = req.body.email.toLowerCase();
        USER.create(req.body, function (err) {
          if (err) {
            console.log(err.message);
            return showError(
              req,
              "/register",
              "make sure all inputs are filled",
              res
            );
          }
          let message = new Message(
            req.body.email,
            "Welcome To Temenos Global",
            "Welcome to the temenos family",
            welcome(req.body.firstName)
          );
          transporter.sendMail(message, function (err, info) {
            if (err)
              console.log(
                "an error occured sending welcome message",
                err.message
              );
          });
          return next();
        });
      }
    });
  },
  passport.authenticate("user", {
    successRedirect: "/dashboard",
    failureRedirect: "/register",
    failureFlash: true,
  })
);

// referral link
router.post(
  "/register/:id",
  function (req, res, next) {
    console.log(req.body);
    USER.findOne({ email: req.body.email }).then((user) => {
      if (user) {
        return showError(req, "/register", "this email isn't available", res);
      } else {
        req.body.email = req.body.email.toLowerCase();
        USER.create(req.body, function (err) {
          if (err) {
            console.log(err.message);
            return showError(req,"/register","make sure all inputs are filled",res);
          }
          if(req.params.id){
            USER.updateOne(
              { id: req.params.id },
              { $push: { referrals: req.body.email } },
              function (err, data) {
                if (err) {
                  console.log("error trying to update referral list");
                }
              }
            );
          }
          let message = new Message(
            req.body.email,
            "Welcome To Temenos Global",
            "Welcome to the temenos family",
            welcome(req.body.firstName)
          );
          transporter.sendMail(message, function (err, info) {
            if (err)
              console.log("an error occured sending welcome message",err.message);
          });
          return next();
        });
      }
    });
  },
  passport.authenticate("user", {
    successRedirect: "/dashboard",
    failureRedirect: "/register",
    failureFlash: true,
  })
);

router.post("/account", isAuth, function (req, res) {
  const { email, walletAddress, password } = req.body;
  if (!email.trim() || !password.trim())
    return showError(req, "/account", "email or password field cannot be empty", res);
  USER.updateOne(
    { email: req.user.email },
    { email, walletAddress, password },
    function (err, data) {
      if (err)
        return showError(req,"/account","an error occured, please report this problem",res);
        return res.redirect("/account");
    }
  );
});

router.post("/withdraw", isAuth, function (req, res) {
  const { amount } = req.body;
  if (!Number(amount))
    return showError(
      req,
      "/withdraw",
      "your Withdrawal amount value was not accepted",
      res
    );
  if (req.user.fundingBallance >= Number(amount)) {
    USER.updateOne(
      { email: req.user.email },
      { $inc: { fundingBallance: -Number(amount) } },
      function (err) {
        if (err) {
          console.log(err);
          return showError(
            req,
            "/withdraw",
            "an error occured during withdrawal",
            res
          );
        }
        TRANSACTION.create({
          user: req.user._id,
          email: req.user.email,
          title: "withdraw",
          amount: Number(amount),
        })
          .then((data) => {
            let message = new Message(
              req.user.email,
              `You have applied for a withdrawal of ${amount}`,
              `Your application for a withdrawal of ${amount} has been received and will be confirmed within 24 hours`,
              withdrawRequest(req.user.firstName, amount)
            );
            transporter.sendMail(message, function (err, info) {
              if (err)
                console.log(
                  "an error occured sending welcome message",
                  err.message
                );
            });
            return res.redirect("/withdraw");
          })
          .catch((err) => {
            console.log(err);
            return showError(
              req,
              "/withdraw",
              "an error occured during withdrawal",
              res
            );
          });
      }
    );
  } else {
    return showError(req, "/withdraw", "insufficient ballance", res);
  }
});

router.post("/transfer", isAuth, function (req, res) {
  let update = {};
  const { amount, to, from } = req.body;
  console.log(req.body);
  if (Number(amount) && to && from) {
    if (req.user[from] >= Number(amount)) {
      if (req.user[from] == req.user[to]) return res.redirect("/transfer");
      update[from] = req.user[from] - Number(amount);
      update[to] = req.user[to] + Number(amount);
      USER.updateOne({ email: req.user.email },{...update,$push: { activities: { type: "transfer", from, to, amount: amount } },})
        .then(() => {
          res.redirect("/transfer");
        })
        .catch((err) => {
          return showError(req,"/transfer","an error occured, trying to update your balances,report this problem",res);
        });
    } else {
      return showError(req, "/transfer", "insufficient Balance", res);
    }
  } else {
    return showError(req,"/transfer","Please fill all inputs for this transaction",res);
  }
});
let loc = path.join(__dirname, "../../uploads");
router.post("/deposit", isAuth, function (req, res) {
  upload(req, res, function (err) {
    const { means, amount } = req.body;
    if (err instanceof multer.MulterError) {
      return showError(
        req,
        "/deposit",
        "a run time error occured, please report this to the management",
        res
      );
    } else if (err) {
      console.log("error occured in multer", err.message);
      // An unknown error occurred when uploading.
      return showError(req, "/deposit", err.message, res);
    }
    // Everything went fine.
    cloudinary.uploader.upload(
      loc + "/" + req.file.filename,
      {
        folder: "receipt",
        use_filename: true,
        // unique_filename : true,
      },
      function (error, result) {
        if (error) {
          console.log(error);
          return showError(
            req,
            "/deposit",
            "an error occured, trying to upload your file",
            res
          );
        }
        TRANSACTION.create({
          user: req.user._id,
          email: req.user.email,
          title: "deposit",
          means,
          amount: Number(amount),
          imageurl: result.secure_url,
        })
          .then(() => {
            let message = new Message(
              req.user.email,
              `You placed Deposit of $${amount}  on your account`,
              `Your deposit of $${amount} has been received and awaiting confirmation before being credited`,
              depositRequest(req.user.firstName, amount)
            );
            transporter.sendMail(message, function (err) {
              if (err) console.log(err);
            });
            return showError(
              req,
              "/deposit",
              "succesfully uploaded, awaiting confirmation",
              res
            );
          })
          .catch((err) => {
            console.log(err);
            return showError(
              req,
              "/deposit",
              "an error occured in trying to make deposit",
              res
            );
          });
      }
    );
  });
});

router.post("/invest", isAuth, getInvestments, function (req, res) {
  if (req.user[req.body.type] < Number(req.body.amount))
    return showError(req, "/invest", "insufficient balance", res);
  if (req.body.type == "shortBallance") {
    plan = res.locals.normalInvestments.filter(
      (investment) => investment.title == req.body.title
    )[0];
    // what if its not an array but a string
    disallowed = req.user.disallowedPlans.filter(
      (blocked) => blocked == JSON.parse(JSON.stringify(plan._id))
    );
    if (disallowed.length)
      return showError(
        req,
        "/invest",
        " this plan is not available to you ",
        res
      );
    //  check if user has a normal investment that has not been paid
    if (!plan)
      return showError(req, "/invest", "couldn't find your selected plan", res);
    if (
      Number(req.body.amount) < plan.min ||
      Number(req.body.amount) > plan.max ||
      !Boolean(Number(req.body.amount))
    )
      return showError(
        req,
        "/invest",
        `can't invest $${req.body.amount} in ${req.body.title} `,
        res
      );
    return SHORTINVS.findOne(
      { user: JSON.parse(JSON.stringify(req.user._id)), paid: false },
      function (err, unpaidShorts) {
        if (err)
          return showError(
            req,
            "/invest",
            "an error occured on the server, please report this problem",
            res
          );
        if (unpaidShorts)
          return showError(
            req,
            "/invest",
            "you still have an un matured short-term investment running",
            res
          );
        USER.updateOne(
          { email: req.user.email },
          {
            $inc: { shortBallance: -Number(req.body.amount) },
          }
        )
          .then(() => {
            SHORTINVS.create({
              user: req.user._id,
              title: plan.title,
              duration: plan.duration,
              roi: plan.roi,
              expiry: new Date(addDays(Date.now(), plan.duration)).getTime(),
              amount: Number(req.body.amount),
              profit: Number(req.body.amount) * (plan.roi / 100),
            })
              .then(() => res.redirect("/invest"))
              .catch((err) => {
                console.log(err.message);
                return showError(
                  req,
                  "/invest",
                  "an error occured on the server, please report this problem",
                  res
                );
              });
          })
          .catch((err) => {
            console.log(err.message);
            return showError(
              req,
              "/invest",
              "an error occured on the server, please report this problem",
              res
            );
          });
      }
    );
  }
});

// changing pass link 
router.post('/changepassword/:timestamp/:id', function(req,res){
    if(req.body.pass1 !== req.body.pass2 || !req.body.pass1) {
      req.flash('error', "passwords didn't match")
      return res.redirect(req.params.id)
    } 
   return USER.findOne({_id : req.params.id}, function(err,user){
          if(err) return res.send('an error on the server please report this problem to our care support')
          if(!user) return res.send('sorry this link is broken, contact our care support for further information')
          return USER.updateOne({_id : req.params.id},
            {password : req.body.pass1},
            function(err){
              if(err) return res.send('an error on the server please report this problem to our care support')
              req.flash('success', 'Password changed')
              let message = new Message(user.email,
                "You changed your password",
              "you successfully changed your password",
              ChangedPasswordSuccessfully(user.firstName)
              )
              transporter.sendMail(message, function(err){
                console.log("error sending change of password email")
              })
              return res.redirect(req.params.id)
          })
    })  
})
// this is the template to send email for change of password > 
// this template can be used for blank template
// USER.findOne({email : "vergheseannu@gmail.com"}, function(err,d){
//   console.log(d)
//   let message = new Message("azukachukwuebuk07@gmail.com","Change of password", "", 
//     // requestChangePassword(d.firstName, getTime(addHours(new Date(), 24), new Date()),JSON.parse(JSON.stringify(d._id)) )
//     requestChangePassword(d.firstName,getTime(addHours(new Date(), 24)),JSON.parse(JSON.stringify(d._id)) )
//   )
//   transporter.sendMail(message, function(err,da){
//     if(err) return console.log(err)
//     console.log("sent....", da)
//   })
// })

module.exports = router;
