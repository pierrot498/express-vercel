module.exports = app => {
  const participants = require("../controllers/participants.controller.js");

  var router = require("express").Router();

  // Retrieve all participants
  router.get("/", participants.findAll);

  // Create a new participants
  router.post("/register", participants.create);

  // Get best player with highest score
  router.get("/bestPlayer", participants.bestPlayer);

  // Get signature for claim
  router.get("/claim/:address", participants.claim);

  // Retrieve a single participants with id
  router.get("/:address", participants.findOne);

  // Refresh participants points and bets
  router.put("/refresh", participants.refresh);

  // Update a participants with id
  router.put("/:address", participants.update);
  
  app.use("/api/participants", router);
};
