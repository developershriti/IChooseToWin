//Create an http component
var http = require('http'); //http is the core node module
var querystring = require('querystring');

//create an express object -- npm install express --save
var express = require("express");
var nodemailer = require("nodemailer");
var bodyParser = require("body-parser"); //this does not support multipart body parsing
var app = express();

//Increase maximum request body length to allow image data to be sent in the request
app.use(bodyParser.json({
    limit: '50mb'
}));

//connect to mongodb
var mongoose = require('mongoose');
//mongoose.connect("mongodb://localhost:27017/ichoosetowin");
mongoose.connect("mongodb://dbadmin:Apple718@ds041673.mongolab.com:41673/ichoosetowin");

//use body-parser
app.use(bodyParser.json()); //this will now not handle the multipart stuff

//set public resources
app.use("/images", express.static(__dirname + "/images"));
app.use("/js", express.static(__dirname + "/js"));
app.use("/css", express.static(__dirname + "/css"));
app.use("/fonts", express.static(__dirname + "/fonts"));

//setup a view engine
app.set("view engine", "vash");

//Get model Reference
var userImageObj = require("./models/userImages.js");

//Module to generate UUID
var uuid = require('node-uuid');

var server = http.createServer(app);
server.listen(3000);

var smtpTransport = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: "attaullah.zai@gmail.com",
        pass: "yafxbohbjksefvsn"
    }
});

app.get("/index", function (req, res) {
    res.render("../views/index.vash", {
        title: "IChooseToWin"
    });
});

app.post("/saveImageToDb", function (req, res) {
    //console.log(req.body);
    var _userImageId = uuid.v4();
    var _name = req.body.name;
    var _skill = req.body.skill;
    var _imageData = req.body.imageData;
    var _date = req.body.date;

    var entity = new userImageObj({
        imageId: _userImageId,
        imageData: _imageData,
        userName: _name,
        userSkill: _skill,
        date: _date
    });
    //console.log("entity to save: " + entity);

    entity.save(function (err, resObj) {
        if (err) {
            console.log(err);
            //rollbar.handleErrorWithPayloadData(err,{level: "warning", custom: {someKey: "arbitrary value"}} );
            return res.status(500).send(err);
        } else {
            //console.log("saved to db: " + resObj);
            return res.status(201).send({
                imageDetail: resObj
            });
        }
    });
    /*return res.status(201).send({
        message: "OK it worked"
    });*/
});

app.get("/loadImage", function (req, res) {
    var _imageId = req.query.imageid;
    console.log(_imageId);
    userImageObj.findOne({
        imageId: _imageId
    }, function (err, s) {
        if (!s) {
            res.render("../views/404.vash", {
                title: "Error",
                message: "Store does not exist"
            });
        } else {
            /*var imageData = s.imageData.substring(22);
            res.render("../views/viewimage.vash", {
                title: "Image",
                imageData: s.imageData
            });*/
            res.redirect(s.imageData);
        }
    });
});

app.post('/send', function (req, res) {
    //console.log(req.body.to);
    var mailOptions = {
            from: "attaullah.zai@gmail.com",
            to: req.body.to,
            subject: req.body.subject,
            text: req.body.text,
            attachments: [{
                path: req.body.imageData
        }]
        }
        //console.log(mailOptions);
    smtpTransport.sendMail(mailOptions, function (error, response) {
        if (error) {
            console.log(error);
            res.end("error");
        } else {
            //console.log("Message sent: " + response.message);
            res.end("sent");
        }
    });
});
