var express = require("express");
var router = express.Router();

var twilio = require("twilio");
const jokes = require("./jokes");

const client = require("./index").client;

// const client = twilio(
//   process.env.TWILIO_ACCOUNT_SID,
//   process.env.TWILIO_AUTH_TOKEN
// );

const STATES = {
  NEW: 0,
  WAITING_FOR_PERSON: 1,
  WAITING_FOR_PHONE_NUMBER: 2,
  JOKE_SENT: 3,
};

//// SMS RESPONSE
router.post("/", function (req, res, next) {
  const MessagingResponse = twilio.twiml.MessagingResponse;
  const twiml = new MessagingResponse();

  console.log("request.session", req.session);

  const state = req.session.state || STATES.NEW;

  // Add a text message.
  let msg;

  if (state == STATES.WAITING_FOR_PERSON) {
    twiml.redirect("/sms/get-person");
  } else if (state == STATES.WAITING_FOR_PHONE_NUMBER) {
    twiml.redirect("/sms/get-number");
  } else {
    msg = twiml.message(
      "Thanks for texting the Quarter-Life Crisis Hotline! We're here to help. Who's currently going through a crisis? \n 1) Me \n 2) Someone else"
    );

    // Add a picture message.
    msg.media("https://quarterlifecris.is/social-preview.jpg");
    req.session.state = STATES.WAITING_FOR_PERSON;
  }

  res.writeHead(200, { "Content-Type": "text/xml" });
  res.end(twiml.toString());
});

//// SMS RESPONSE
router.post("/get-person", (req, res) => {
  const twiml = new MessagingResponse();

  if (req.body.Body.includes("1") || req.body.Body.includes("me")) {
    twiml.message(
      "Alright, let me find something for you to do with your life..."
    );
    twiml.redirect("/sms/say-joke");
  } else if (req.body.Body.includes("2") || req.body.Body.includes("someone")) {
    twiml.message(
      "Reply to this message with your friend's phone number and we'll take it from here."
    );
    req.session.state = STATES.WAITING_FOR_PHONE_NUMBER;
  } else {
    twiml.message("Sorry! I didn't understand that. Try again in a bit.");
    req.session.state = STATES.NEW;
  }

  res.writeHead(200, { "Content-Type": "text/xml" });
  res.end(twiml.toString());
});

//// SMS RESPONSE
router.post("/get-number", (req, res) => {
  const number = req.body.Body.replace("[()\\s-]+", "");
  const host = "https://quarterlifecris.is:5000";

  req.session.state = STATES.JOKE_SENT;

  client.calls
    .create({
      url: `${host}/call-a-friend`,
      to: `+${number}`,
      from: "+18124873463",
    })
    .then((call) => {
      res.send(call);
    })
    .catch((err) => {
      res.send(err);
    });

  res.writeHead(200, { "Content-Type": "text/xml" });
  res.end(twiml.toString());
});

//// SMS RESPONSE
router.post("/say-joke", function (req, res, next) {
  const MessagingResponse = twilio.twiml.MessagingResponse;
  const twiml = new MessagingResponse();

  // Add a text message.
  let msg = twiml.message(
    "Thanks for texting the Quarter-Life Crisis Hotline! We're here to help. Who's currently going through a crisis? \n 1) Me \n 2) Someone else"
  );

  req.session.state = STATES.JOKE_SENT;

  res.writeHead(200, { "Content-Type": "text/xml" });
  res.end(twiml.toString());
});

module.exports = router;
