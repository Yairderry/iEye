const express = require("express");
const tesseract = require("node-tesseract-ocr");

const text = express.Router();

text.post("/", (req, res) => {
  const { base64 } = req.body;

  const img = Buffer.from(base64, "base64");

  const config = {
    lang: "eng+heb",
    oem: 1,
    psm: 3,
  };

  tesseract
    .recognize(img, config)
    .then((text) => {
      res.send(text);
    })
    .catch((error) => {
      console.log(error.message);
      res.status(500).send("failed lol");
    });
});

module.exports = text;
