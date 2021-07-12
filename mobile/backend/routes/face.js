const tf = require("@tensorflow/tfjs-node");
const fs = require("fs");
const image = require("@canvas/image");
const faceapi = require("@vladmandic/face-api");
const path = require("path");
const recursive = require("recursive-readdir");

const express = require("express");

const face = express.Router();

const modelPath = path.join(__dirname, "../models");
let labeledImages;

// load models
Promise.all([
  faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath),
  faceapi.nets.ageGenderNet.loadFromDisk(modelPath),
  faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath),
  faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath),
  faceapi.nets.faceExpressionNet.loadFromDisk(modelPath),
]).then(() => {
  const loadLabeledImages = async () => {
    const files = await new Promise((resolve, reject) => {
      recursive(path.resolve("./facesDB"), (err, files) => {
        if (err) return reject(err);
        resolve(files);
      });
    });

    const labels = [];

    files.forEach((file) => {
      const matches = /facesDB\\(.*)\\(.*)/.exec(file);
      const label = labels.find(({ name }) => name === matches[1]);

      if (label) return label.count++;

      labels.push({ name: matches[1], count: 1 });
    });

    return Promise.all(
      labels.map(async ({ name, count }) => {
        const descriptions = [];
        for (let i = 1; i <= count; i++) {
          const tensor = await imageToTensor(`./facesDB/${name}/${i}.jpg`);

          const detections = await faceapi
            .detectAllFaces(tensor)
            .withFaceLandmarks()
            .withFaceDescriptors();

          descriptions.push(detections[0].descriptor);
        }
        return new faceapi.LabeledFaceDescriptors(name, descriptions);
      })
    );
  };

  const imageToTensor = async (imageFile) => {
    const buffer = fs.readFileSync(imageFile); // read image from disk
    const canvas = await image.imageFromBuffer(buffer); // decode to canvas
    const imageData = image.getImageData(canvas); // read decoded image data from canvas

    return tf.tidy(() => {
      // create tensor from image data
      const data = tf.tensor(
        Array.from(imageData?.data || []),
        [canvas.height, canvas.width, 4],
        "int32"
      ); // create rgba image tensor from flat array and flip to height x width
      const channels = tf.split(data, 4, 2); // split rgba to channels
      const rgb = tf.stack([channels[0], channels[1], channels[2]], 2); // stack channels back to rgb
      const reshape = tf.reshape(rgb, [1, canvas.height, canvas.width, 3]); // move extra dim from the end of tensor and use it as batch number instead
      return reshape;
    });
  };
  loadLabeledImages().then((data) => (labeledImages = data));
});

face.post("/", async (req, res) => {
  const { base64 } = req.body;

  const img = Buffer.from(base64, "base64");
  const canvas = await image.imageFromBuffer(img); // decode to canvas
  const imageData = image.getImageData(canvas); // read decoded image data from canvas

  const tensor = tf.tidy(() => {
    // create tensor from image data
    const data = tf.tensor(
      Array.from(imageData?.data || []),
      [canvas.height, canvas.width, 4],
      "int32"
    ); // create rgba image tensor from flat array and flip to height x width
    const channels = tf.split(data, 4, 2); // split rgba to channels
    const rgb = tf.stack([channels[0], channels[1], channels[2]], 2); // stack channels back to rgb
    const reshape = tf.reshape(rgb, [1, canvas.height, canvas.width, 3]); // move extra dim from the end of tensor and use it as batch number instead
    return reshape;
  });
  const faceMatcher = new faceapi.FaceMatcher(labeledImages, 0.6);

  const detections = await faceapi
    .detectAllFaces(tensor)
    .withFaceLandmarks()
    .withFaceExpressions()
    .withFaceDescriptors()
    .withAgeAndGender();

  const results = detections.map((d) => {
    d.faceMatcher = faceMatcher.findBestMatch(d.descriptor);
    return d;
  });

  res.send(results);
});

module.exports = face;
