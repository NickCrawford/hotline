var express = require("express");
var router = express.Router();
var twilio = require("twilio");
var env = require("dotenv").config();

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Quarter-Life Crisis Hotline" });
});

router.get("/suggest", function (req, res, next) {
  res.render("suggest", { title: "Quarter-Life Crisis Hotline - Suggest" });
});

router.get("/about", function (req, res, next) {
  res.render("about", { title: "Quarter-Life Crisis Hotline - About" });
});

router.get("/resources", function (req, res, next) {
  res.render("resources", { title: "Quarter-Life Crisis Hotline - About" });
});

router.post("/humor-hotline", function (req, res, next) {
  // route code here
  const number = req.body.number.replace("[()\\s-]+", "");
  const host = "https://quarterlifecris.is:5000";

  client.calls
    .create({
      url: `${host}/voice-response`,
      to: `+${number}`,
      from: "+12565768775",
    })
    .then((call) => {
      res.send(call);
    })
    .catch((err) => {
      res.send(err);
    });
});

router.post("/voice-response", function (req, res, next) {
  // creates new VoiceResponse object
  var VoiceResponse = twilio.twiml.VoiceResponse;
  var twiml = new VoiceResponse();

  // Creates an array of jokes and randomly chooses one to deliver
  const jokes = [
    "A plateau is the highest form of flattery.",
    "Don't trust atoms, they make up everything.",
    "Trying to write with a broken pencil is pointless",
    "I'm reading a book about anti-gravity. It's impossible to put down.",
    "Want to hear a joke about paper? Nevermind, it's tear-able.",
    "I was going to share a vegetable joke but it's corny.",
    "Is your refrigerator running? Better go catch it!",
  ];

  const joke = jokes[Math.floor(Math.random() * jokes.length)];

  // creates the text-to-speech response
  twiml.pause({ length: 1 });
  twiml.say(joke, {
    voice: "alice",
  });
  res.send(twiml.toString());
});

module.exports = router;
