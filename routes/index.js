var express = require("express");
var router = express.Router();
var twilio = require("twilio");
var env = require("dotenv").config();
const jokes = require("./jokes");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const voice = "Polly.Amy";

/// PAGES
/* GET home page. */
router.get("/", function (request, response, next) {
  response.render("index", { title: "Quarter-Life Crisis Hotline" });
});

router.get("/suggest", function (request, response, next) {
  response.render("suggest", {
    title: "Quarter-Life Crisis Hotline - Suggest",
  });
});

router.get("/about", function (request, response, next) {
  response.render("about", { title: "Quarter-Life Crisis Hotline - About" });
});

router.get("/resources", function (request, response, next) {
  response.render("resources", {
    title: "Quarter-Life Crisis Hotline - Resources",
  });
});

///
////// OUTBOUND CALLING
///
router.post("/humor-hotline", function (request, response, next) {
  // route code here
  const number = request.body.number.replace("[()\\s-]+", "");
  const host = "https://quarterlifecris.is:5000";

  client.calls
    .create({
      url: `${host}/call-a-friend`,
      to: `+${number}`,
      from: "+18124873463",
    })
    .then((call) => {
      response.send(call);
    })
    .catch((err) => {
      response.send(err);
    });
});

/// INCOMING VOICE RESPONSE
router.post("/voice-response", function (request, response, next) {
  // creates new VoiceResponse object
  var VoiceResponse = twilio.twiml.VoiceResponse;
  var twiml = new VoiceResponse();

  const gather = twiml.gather({
    numDigits: 1,
    timeout: 10,
    action: "/gather-person",
    input: "dtmf",
  });

  gather.say(
    "Hello, thank you for calling the Quarter-Life Crisis Hotline. If you're currently going through a Quarter-Life Crisis, press 1. If someone you know is going through a Quarter-Life Crisis, press 2. If you're in denial, press 3. If you're looking for the Mid Life Crisis Hotline, please hang up and call again in 30 years.",
    { voice: voice }
  );

  // If the user doesn't enter input, loop
  twiml.redirect("/voice-response");

  // Render the response as XML in reply to the webhook request
  response.type("text/xml");
  response.send(twiml.toString());
});

/// INCOMING VOICE RESPONSE
router.post("/call-a-friend", (request, response, next) => {
  // creates new VoiceResponse object
  var VoiceResponse = twilio.twiml.VoiceResponse;
  var twiml = new VoiceResponse();

  twiml.say(
    "Hi there, one of your friends told us you're going through a Quarter-Life Crisis. We're here to help!",
    { voice: voice }
  );

  // If the user doesn't enter input, loop
  twiml.redirect("/ask-job");

  // Render the response as XML in reply to the webhook request
  response.type("text/xml");
  response.send(twiml.toString());
});

router.post("/say-joke", (request, response, next) => {
  var VoiceResponse = twilio.twiml.VoiceResponse;
  var twiml = new VoiceResponse();

  const indexOne = Math.floor(Math.random() * jokes.length);
  const indexTwo = Math.floor(Math.random() * jokes.length);

  if (indexOne == indexTwo) indexTwo = Math.floor(Math.random() * jokes.length);

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

  response.send(twiml.toString());
});

// Create a route that will handle <Gather> input
router.post("/gather-person", (request, response) => {
  // Use the Twilio Node.js SDK to build an XML response
  // creates new VoiceResponse object
  var VoiceResponse = twilio.twiml.VoiceResponse;
  var twiml = new VoiceResponse();

  // If the user entered digits, process their request
  if (request.body.Digits) {
    switch (request.body.Digits) {
      case "1":
        // twiml.say("You selected yourself.", { voice, voice });
        twiml.pause();
        twiml.redirect("/ask-job");

        break;
      case "2":
        twiml.say("You selected someone else.", { voice, voice });
        twiml.pause();
        twiml.redirect("/someone-else");
        break;
      case "3":
        twiml.say(
          "Hmm. You're in denial, okay. Why don't you call back when you're ready.",
          { voice, voice }
        );
        twiml.pause();
        twiml.say("Goodbye!", { voice, voice });
        twiml.hangup();
        break;

      default:
        twiml.say("Sorry, I don't understand that choice.");
        twiml.pause();
        twiml.redirect("/voice-response");
        break;
    }
  } else {
    // If no input was sent, redirect to the /voice route
    twiml.redirect("/voice-response");
  }

  // Render the response as XML in reply to the webhook request
  response.type("text/xml");
  response.send(twiml.toString());
});

router.post("/ask-job", function (request, response, next) {
  // creates new VoiceResponse object
  var VoiceResponse = twilio.twiml.VoiceResponse;
  var twiml = new VoiceResponse();

  const gather = twiml.gather({
    numDigits: 1,
    timeout: 6,
    action: "/quit-job",
    input: "dtmf",
  });

  gather.say(
    "Okay, first, have you quit your job already? Press 1 for yes. Press 2 for no.",
    { voice: voice }
  );

  // If the user doesn't enter input, loop
  // twiml.say("Are you there?")
  twiml.redirect("/ask-job");

  // Render the response as XML in reply to the webhook request
  response.type("text/xml");
  response.send(twiml.toString());
});

router.post("/quit-job", (request, response, next) => {
  var VoiceResponse = twilio.twiml.VoiceResponse;
  var twiml = new VoiceResponse();

  // If the user entered digits, process their request
  if (request.body.Digits) {
    switch (request.body.Digits) {
      case "1":
        twiml.say("Congrats! Go off queen! Capitalism is made-up anyways.", {
          voice: voice,
        });
        twiml.pause();
        twiml.say(
          "Now, give me just a second and I'll find something else for you to do with your life.",
          { voice: voice }
        );
        twiml.pause();
        twiml.redirect("/say-joke");

        break;
      case "2":
        twiml.say("YOLO. Go ahead and quit that job ASAP.", {
          voice: voice,
        });
        twiml.pause();
        twiml.say("Let me find something else for you to do with your life.", {
          voice: voice,
        });
        twiml.pause();
        twiml.redirect("/say-joke");
        break;

      default:
        twiml.say("Hey, I said press 1 or 2. What are you trying here?");
        twiml.pause();
        twiml.hangup();
        break;
    }
  } else {
    // If no input was sent, redirect to the /voice route
    twiml.redirect("/ask-job");
  }

  // Render the response as XML in reply to the webhook request
  response.type("text/xml");
  response.send(twiml.toString());
});

router.post("/someone-else", function (request, response, next) {
  // creates new VoiceResponse object
  var VoiceResponse = twilio.twiml.VoiceResponse;
  var twiml = new VoiceResponse();

  twiml.say(
    "We just sent you a text that you can forward to your friend. Hope it helps! Thanks for calling and goodbye.",
    { voice }
  );

  client.messages
    .create({
      body: "Hi there, this is the Quarter-Life Crisis Hotline. Reply with 'START' to begin. \n\n https://quarterlifecris.is",
      from: "+18124873463",
      to: request.body.From,
    })
    .then((message) => {
      response.send(message);
      request.session.state = 2;
    })
    .catch((err) => {
      response.send(err);
    });

  // Render the response as XML in reply to the webhook request
  response.type("text/xml");
  response.send(twiml.toString());
});

module.exports = router;
module.exports.client = client;
