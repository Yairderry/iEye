const express = require("express");
const path = require("path");
const recursive = require("recursive-readdir");

const face = express.Router();
face.use(express.json());

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

module.exports = face;
