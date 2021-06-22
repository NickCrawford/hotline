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
    "Adopt an ant farm",
    "Get really into lock-picking",
    "Download TikTok",
    "Adopt a pet raccoon",
    "do something involving a lizard ",
    "Get really into day trading ",
    "Get a planet fitness membership",
    "Buy kettlebells",
    "Become a barista at a cute coffee shop and quit two-weeks later",
    "Start a SoundCloud and learn to rap",
    "Become an e-girl",
    "Start making kombucha and forget about it",
    "Create a quarter-life crisis hotline instead of actually getting a job",
    "Start an alt-twitter",
    "Move to Ohio",
    "Move to New York",
    "Move to Colorado",
    "Move to California",
    "Get a nose piercing",
    "Get a tattoo",
    "Dye your hair",
    "Start listening to way too much Hozier",
    "Buy a tiny a house",
    "Buy a 3D printer",
    "Start making memes for Instagram",
    "Start a creator house",
    "Get married too soon",
    "Start a podcast about dating",
    "Start a podcast about crypto",
    "Get really into doge coin",
    "Rob a bank",
    "Start going to therapy",
    "Become low-key alcoholic",
    "Become high-key alcoholic",
    "Quit your salaried job to become a bartender",
    "Start brewing IPAs in your kitchen",
    "Get really into 3D printing ",
    "Start knitting scarves",
    "Take a trip to Miami",
    "Start an agency",
    "Tell all your friends you’re going to become a pilot",
    "Tyedye EVERYTHING in your closet",
    "Start a depop even though you own no clothes",
    "Start a podcast",
    "Start doing pottery",
    "Start a band",
    "Start a skater girl gang",
  ];

  const indexOne = Math.floor(Math.random() * jokes.length);
  const indexTwo = Math.floor(Math.random() * jokes.length);

  if (indexOne == indexTwo) indexTwo = Math.floor(Math.random() * jokes.length);

  const voice = "Polly.Amy";

  // creates the text-to-speech response
  twiml.say("Hello! Thank you for calling the Quarter-Life Crisis Hotline.", {
    voice: voice,
  });
  twiml.pause({ length: 0.5 });

  twiml.say(
    "We're here to help you figure out what you're doing with your life.",
    {
      voice: voice,
    }
  );
  twiml.pause({ length: 0.5 });

  // twiml.say(
  //   "Give me just one second and I'll come up with some suggestions for you.",
  //   {
  //     voice: voice,
  //   }
  // );
  // twiml.pause({ length: 2 });

  twiml.say("The universe is telling me that you should...", {
    voice: voice,
  });

  // Say joke one
  twiml.say(jokes[indexOne], {
    voice: voice,
  });

  // Plus "and/or"
  twiml.say("and", {
    voice: voice,
  });

  // Say option two
  twiml.say(jokes[indexTwo], {
    voice: voice,
  });

  twiml.pause({ length: 1 });

  twiml.say(
    "I hope that helps! Let us know how it works out and feel free to call back anytime. Goodbye!",
    {
      voice: voice,
    }
  );

  res.send(twiml.toString());
});

module.exports = router;
