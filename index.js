import { InboxStream, CommentStream, SubmissionStream } from "snoostorm";
import Snoowrap from "snoowrap";
require("dotenv").config();

const client = new Snoowrap({
    userAgent: process.env.REDDIT_USER_AGENT,
    clientId: process.env.REDDIT_CLIENT_ID,
    clientSecret: process.env.REDDIT_CLIENT_SECRET,
    refreshToken: process.env.REDDIT_REFRESH_TOKEN,
  });

// Alternatively, just pass in a username and password for script-type apps.
// const otherRequester = new snoowrap({
//     userAgent: process.env.REDDIT_USER_AGENT,
//     clientId: process.env.REDDIT_CLIENT_ID,
//     clientSecret: process.env.REDDIT_CLIENT_SECRET,
//     username: process.env.REDDIT_USERNAME,
//     password: process.env.REDDIT_PASSWORD,
//   });

// Options object is a Snoowrap Listing object, but with subreddit and pollTime options
const comments = new CommentStream(client, {
  subreddit: "AskReddit",
  limit: 10,
  pollTime: 2000,
});
comments.on("item", console.log);

const submissions = new SubmissionStream(client, {
  subreddit: "AskReddit",
  limit: 10,
  pollTime: 2000,
});
submissions.on("item", console.log);

const inbox = new InboxStream(client);
inbox.on("item", console.log);

inbox.end();
inbox.on("end", () => console.log("And now my watch has ended"));