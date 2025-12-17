#!/usr/bin/env node

// username changed
const https = require("https");

// Read username from CLI arguments
const username = process.argv[2];

if (!username) {
  console.log("Usage: github-activity <username>");
  process.exit(1);
}

const options = {
  hostname: "api.github.com",
  path: `/users/${username}/events`,
  headers: {
    "User-Agent": "node-cli" // GitHub API requires this
  }
};

function formatEvent(event) {
  const type = event.type;
  const repo = event.repo?.name || "unknown repo";

  switch (type) {
    case "PushEvent":
      const commits = event.payload?.commits?.length || 0;
      return `Pushed ${commits} commit(s) to ${repo}`;

    case "IssuesEvent":
      return `${event.payload.action} an issue in ${repo}`;

    case "WatchEvent":
      return `Starred ${repo}`;

    case "ForkEvent":
      return `Forked ${repo}`;

    case "CreateEvent":
      return `Created a ${event.payload.ref_type} in ${repo}`;

    default:
      return `${type} on ${repo}`;
  }
}

// Make API request
https.get(options, (res) => {
  let data = "";

  if (res.statusCode === 404) {
    console.error("❌ Error: User not found");
    process.exit(1);
  }

  if (res.statusCode === 403) {
    console.error("❌ Error: API rate limit exceeded");
    process.exit(1);
  }

  res.on("data", chunk => {
    data += chunk;
  });

  res.on("end", () => {
    try {
      const events = JSON.parse(data);

      if (events.length === 0) {
        console.log("No recent activity found.");
        return;
      }

      console.log(`\n📌 Recent activity for ${username}:\n`);

      events.slice(0, 10).forEach(event => {
        console.log("- " + formatEvent(event));
      });

    } catch {
      console.error("❌ Error parsing response");
    }
  });

}).on("error", () => {
  console.error("❌ Network error");
});
