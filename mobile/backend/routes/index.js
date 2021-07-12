const { Router } = require("express");
const face = require("./face");
const text = require("./text");
const speech = require("./speech");

const api = Router();

api.use("/face", face);
api.use("/text", text);
api.use("/speech", speech);

module.exports = api;
