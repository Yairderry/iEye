const express = require("express");
const path = require("path");
const recursive = require("recursive-readdir");
const fs = require("fs");

const face = express.Router();

face.get("/:name/:image", (req, res) => {
  const { name, image } = req.params;
  const path = __dirname.substring(0, __dirname.length - 7);

  res.sendFile(path + `/facesDB/${name}/${image}.jpg`);
});

face.get("/labels", (req, res) => {
  recursive(path.resolve("./facesDB"), (err, files) => {
    if (err) return res.status(500).json(err);

    const labels = [];

    files.forEach((file) => {
      const matches = /facesDB\\(.*)\\(.*)/.exec(file);
      const label = labels.find(({ name }) => name === matches[1]);

      if (label) return label.count++;

      labels.push({ name: matches[1], count: 1 });
    });

    res.json(labels);
  });
});

face.post("/save/:name", (req, res) => {
  const { name } = req.params;
  const { data } = req.body;
  const base64Data = data.replace(/^data:image\/jpeg;base64,/, "");

  // check if there is such person in DB
  const labels = fs.readdirSync(path.resolve("./facesDB"));
  const face = labels.find(
    (label) => label.toLowerCase() === name.toLowerCase()
  );

  // create person folder in the DB
  if (!face) {
    fs.mkdirSync(path.join(`./facesDB`, name));
  }

  // get last image number
  const lastImage = fs
    .readdirSync(path.resolve(`./facesDB/${name}`))
    .map((file) => /(.*).jpg/.exec(file)[1])
    .reduce((a, b) => {
      return Math.max(a, b);
    }, 0);

  // add new image to person's folder
  fs.writeFile(
    path.resolve(`./facesDB/${name}/${lastImage + 1}.jpg`),
    base64Data,
    "base64",
    (err) => {
      if (err) return console.log(err);

      res.send("image saved to the database");
    }
  );
});

module.exports = face;
