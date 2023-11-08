// console.log("Initializing User Module");
var knownAvatars = {};
var defaultURL = 'https://www.redditstatic.com/avatars/defaults/v2/avatar_default_7.png';

async function getAvatar(username) {
    var returnURL = defaultURL;
    var cached = false;
    if (knownAvatars[username]) {
      returnURL = knownAvatars[username];
      cached = true;
    } else {
      try {
        returnURL = await fetch(`https://api.reddit.com/user/${username}/about`)
          .then(response => response.json())
          .then(data => {
            const returnAvatar = data.data.icon_img.replace(/&amp;/g, '&') || data.data.snoovatar_img.replace(/&amp;/g, '&') || "unknown";
            if (returnAvatar !== "unknown") {
              knownAvatars[username] = returnAvatar;
            }
            return returnAvatar;
          })
      } catch (err) {
        console.error(err);
      }
    }
    return { url: returnURL, cached: cached };
  }
  
  module.exports = {getAvatar};