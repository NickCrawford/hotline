var express = require("express");
var router = express.Router();

var twilio = require("twilio");
const jokes = require("./jokes");
const prompts = require("./prompts");

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
  WAITING_FOR_SUGGESTION: 4,
};

//// SMS RESPONSE
router.post("/", function (req, res, next) {
  const MessagingResponse = twilio.twiml.MessagingResponse;
  const twiml = new MessagingResponse();

  if (!req.session.state) req.session.state = STATES.NEW;

  const state = req.session.state || STATES.NEW;

  // Add a text message.
  let msg;

  if (state == STATES.WAITING_FOR_PERSON) {
    twiml.redirect("/sms/get-person");
  } else if (state == STATES.WAITING_FOR_PHONE_NUMBER) {
    twiml.redirect("/sms/get-number");
  } else if (state == STATES.WAITING_FOR_SUGGESTION) {
    twiml.redirect("/sms/get-suggestion");
  } else if (state == STATES.JOKE_SENT) {
    if (req.body.Body.toLowerCase().includes("friend")) {
      twiml.message(
        "Reply to this message with your friend's phone number and we'll take it from here."
      );
      req.session.state = STATES.WAITING_FOR_PHONE_NUMBER;
    } else if (req.body.Body.toLowerCase().includes("suggest")) {
      twiml.message("How do you cope with a quarter-life crisis?");
      req.session.state = STATES.WAITING_FOR_SUGGESTION;
    } else {
      twiml.message(
        "Need some more help? brb, Let me find something you could do with your life."
      );
      twiml.redirect("/sms/say-joke");
    }
  } else {
    msg = twiml.message(
      "Thanks for texting the Quarter-Life Crisis Hotline! We're here to help 💪\n\nWho's currently going through a crisis? \n 1) Me \n 2) Someone else"
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
  const MessagingResponse = twilio.twiml.MessagingResponse;
  const twiml = new MessagingResponse();

  if (
    req.body.Body.includes("1") ||
    req.body.Body.toLowerCase().includes("me")
  ) {
    twiml.message(
      "Alright, let me find something for you to do with your life..."
    );
    twiml.redirect("/sms/say-joke");
  } else if (
    req.body.Body.includes("2") ||
    req.body.Body.toLowerCase().includes("someone") ||
    req.body.Body.toLowerCase().includes("else")
  ) {
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

router.post("/get-suggestion", (req, res) => {
  const MessagingResponse = twilio.twiml.MessagingResponse;
  const twiml = new MessagingResponse();

  twiml.message("Thanks for the suggestion!");
  req.session.state = STATES.JOKE_SENT;

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

  const prompt = prompts[Math.floor(Math.random() * prompts.length)];
  // Add a text message.

  const indexOne = Math.floor(Math.random() * jokes.length);
  const indexTwo = Math.floor(Math.random() * jokes.length);

  if (indexOne == indexTwo) indexTwo = Math.floor(Math.random() * jokes.length);

  const allowedEmoji =
    "💩👻👽🤖👾👐🖖✌️🤟🤘🤙👋🐭🦕🦖🐉✨🎸🌮📍✅🙌🔥🕺🏻😭🐶🥳🎱🏄‍♀️🏆✈️🗿⌛️🔌💡🔮🛁🎊🎉✂️❤️🖤🎵";
  const emojiOne =
    allowedEmoji[Math.floor(Math.random() * allowedEmoji.length)];
  const emojiTwo =
    allowedEmoji[Math.floor(Math.random() * allowedEmoji.length)];

  let msg = twiml.message(
    prompt +
      "\n\n" +
      emojiOne +
      " " +
      jokes[indexOne] +
      " " +
      emojiOne +
      +"\n~ and ~\n" +
      emojiTwo +
      " " +
      jokes[indexTwo] +
      " " +
      emojiTwo +
      "\n\n" +
      "I hope that helps! Let us know how it works out 🕺🏻 \n"
  );

  msg.media(
    "https://source.unsplash.com/400x400/?" + encodeURI(jokes[indexOne])
  );

  if (req.session && req.session.counter > 0) {
    req.session.counter = req.session.counter + 1;
  } else {
    req.session.counter = 1;
    twiml.message(
      "Help a friend with their own quarter-life crisis by replying 'friend'.\n\nReply 'suggest' if you'd like to leave a new quarter-life crisis idea for others. \n"
    );
  }

  req.session.state = STATES.JOKE_SENT;

  // res.writeHead(200, { "Content-Type": "text/xml" });
  res.end(twiml.toString());
});

module.exports = router;
