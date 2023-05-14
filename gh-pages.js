var ghpages = require("gh-pages");

ghpages.publish(
  "public", // path to public directory
  {
    branch: "gh-pages",
    repo: "https://github.com/username/functional_harmony.git", // Update to point to your repository
    user: {
      name: "schmisev", // update to use your name
      email: "schmisev@gmail.com", // Update to use your email
    },
  },
  () => {
    console.log("Deploy Complete!");
  }
);
