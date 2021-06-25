var express = require("express");
var router = express.Router();
const fetch = require("node-fetch");

var twilio = require("twilio");
const jokes = require("./jokes");
const prompts = require("./prompts");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

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

  if (req.session && req.session.counter == 3) {
    return client.messages
      .create({
        body: "Geez, you must really be struggling. I can't come up with ideas fast enough for you. Why dont you follow me on Twitter instead? \n\n 👉 https://twitter.com/NickCrawwwford",
        from: "+18124873463",
        to: req.body.From,
      })
      .then((message) => {
        res.send(message);
      })
      .catch((err) => {
        res.send(err);
      });
  }

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
        "Reply to this message with your friend's phone number and we'll help them out!"
      );
      req.session.state = STATES.WAITING_FOR_PHONE_NUMBER;
    } else if (req.body.Body.toLowerCase().includes("suggest")) {
      twiml.message("How do you cope with your quarter-life crisis?");
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
    // msg.media("https://quarterlifecris.is/social-preview.jpg");
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
      "Reply to this message with your friend's phone number and we'll help them out!"
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

  req.session.state = STATES.JOKE_SENT;

  client.messages
    .create({
      body: "Hi there, one of your friends told us you're going through a Quarter-Life Crisis. We're here to help! Text or call us back to find out what you should be doing with your life. \n\n https://quarterlifecris.is",
      from: "+18124873463",
      to: number,
      mediaUrl: ["https://quarterlifecris.is/social-preview.jpg"],
    })
    .then((message) => {
      res.send(message);
    })
    .catch((err) => {
      res.send(err);
    });

  client.messages
    .create({
      body: "Got it! Thanks. We'll take it from here.",
      from: "+18124873463",
      to: req.body.From,
    })
    .then((message) => {
      res.send(message);
    })
    .catch((err) => {
      res.send(err);
    });
});

// router.get("/test", async (req, res, next) => {
//   let imgUrl = `https://api.giphy.com/v1/gifs/random?keyword=${encodeURI(
//     "cool"
//   )}&limit=1&rating=pg-13&api_key=8HeIIl610k43QxmIEgY0rZr931lMzcxY`;

//   const { data } = await fetch(imgUrl).then((res) => res.json());

//   console.log(data.images.downsized.url);
// });

//// SMS RESPONSE
router.post("/say-joke", async (req, res, next) => {
  const MessagingResponse = twilio.twiml.MessagingResponse;
  const twiml = new MessagingResponse();

  const prompt = prompts[Math.floor(Math.random() * prompts.length)];
  // Add a text message.

  let indexOne = Math.floor(Math.random() * jokes.length);
  let indexTwo = Math.floor(Math.random() * jokes.length);

  if (indexOne == indexTwo) indexTwo = Math.floor(Math.random() * jokes.length);

  const allowedEmoji = [
    "💩",
    "👻",
    "👽",
    "🤖",
    "👾",
    "👐",
    "🖖",
    "✌️",
    "🤟",
    "🤘",
    "🤙",
    "👋",
    "🐭",
    "🦕",
    "🦖",
    "🐉",
    "✨",
    "🎸",
    "🌮",
    "📍",
    "✅",
    "🙌",
    "🔥",
    "🕺",
    "😭",
    "🐶",
    "🥳",
    "🎱",
    "🏄‍♀️",
    "🏆",
    "✈️",
    "🗿",
    "⌛️",
    "🔌",
    "💡",
    "🔮",
    "🛁",
    "🎊",
    "🎉",
    "✂️",
    "❤️",
    "🖤",
    "🎵",
  ];
  const emojiOne =
    allowedEmoji[Math.floor(Math.random() * allowedEmoji.length)];
  const emojiTwo =
    allowedEmoji[Math.floor(Math.random() * allowedEmoji.length)];

  console.log(emojiOne, emojiTwo);
  let msg = twiml.message(
    prompt +
      "\n\n" +
      emojiOne +
      " " +
      jokes[indexOne] +
      " " +
      emojiOne +
      "\n~ and ~\n" +
      emojiTwo +
      " " +
      jokes[indexTwo] +
      " " +
      emojiTwo +
      "\n\n" +
      "I hope that helps! Let us know how it works out\n"
  );

  let imgUrl = `https://api.giphy.com/v1/gifs/random?keyword=${encodeURI(
    jokes[indexOne]
  )}&limit=1&rating=pg-13&api_key=8HeIIl610k43QxmIEgY0rZr931lMzcxY`;

  let mediaUrl =
    "https://source.unsplash.com/300x300/?" + encodeURI(jokes[indexOne]);
  try {
    const { data } = await fetch(imgUrl).then((res) => res.json());
    mediaUrl = data.images.fixed_width.url;
  } catch (err) {}

  msg.media(mediaUrl);

  if (req.session && req.session.counter > 0) {
    req.session.counter = req.session.counter + 1;
  } else {
    req.session.counter = 1;

    setTimeout(() => {
      client.messages
        .create({
          body: "Reply 'friend' to share this with someone going through a quarter-life crisis.\n\nReply 'suggest' to leave a new quarter-life crisis idea for others. \n\n  https://quarterlifecris.is",
          from: "+18124873463",
          to: req.body.From,
        })
        .then((message) => {
          res.send(message);
        })
        .catch((err) => {
          res.send(err);
        });
    }, 20000);
  }

  req.session.state = STATES.JOKE_SENT;

  res.writeHead(200, { "Content-Type": "text/xml" });
  res.end(twiml.toString());
});

module.exports = router;
