const { Router } = require("express");
const face = require("./face");

const api = Router();

api.use("/face", face);

module.exports = api;
