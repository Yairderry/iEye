import "./styles/App.css";
import React, { useRef, useEffect, useState } from "react";

// importing models
import * as tf from "@tensorflow/tfjs";
import * as cocossd from "@tensorflow-models/coco-ssd";
import * as faceapi from "face-api.js";
import { recognize } from "tesseract.js";

// importing special react libraries
import Webcam from "react-webcam";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

import {
  drawRect,
  convertObjectDetectionsToObject,
  convertFaceDetectionsToObject,
  viewToText,
  facesToText,
} from "./utils";

function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  const [net, setNet] = useState();

  let { transcript, listening, browserSupportsSpeechRecognition } =
    useSpeechRecognition();

  const loadModels = async () => {
    const [loadedCocoNet] = await Promise.all([
      cocossd.load(),
      faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
      faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
      faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
      faceapi.nets.faceExpressionNet.loadFromUri("/models"),
      faceapi.nets.ageGenderNet.loadFromUri("./models"),
    ]);
    setNet(loadedCocoNet);
  };

  const setRefs = () => {
    if (
      typeof webcamRef.current === "undefined" ||
      webcamRef.current === null ||
      webcamRef.current.video.readyState !== 4
    )
      return setTimeout(setRefs, 10);

    // Get Video Properties
    const video = webcamRef.current.video;
    const videoWidth = webcamRef.current.video.videoWidth;
    const videoHeight = webcamRef.current.video.videoHeight;

    // Set video width
    webcamRef.current.video.width = videoWidth;
    webcamRef.current.video.height = videoHeight;

    // Set canvas height and width
    canvasRef.current.width = videoWidth;
    canvasRef.current.height = videoHeight;
    return video;
  };

  const textToSpeech = (text) => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.85;
    speechSynthesis.speak(utter);
  };

  const describe = async () => {
    const video = setRefs();
    const canvas = canvasRef.current;
    const displaySize = { width: video.width, height: video.height };

    faceapi.matchDimensions(canvas, displaySize);

    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions()
      .withAgeAndGender();
    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    faceapi.draw.drawDetections(canvas, resizedDetections);
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
    faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
    resizedDetections.forEach((result) => {
      const { age, gender, genderProbability } = result;
      new faceapi.draw.DrawTextField(
        [
          `${Math.round(age, 0)} years`,
          `${gender} (${Math.round(genderProbability)})`,
        ],
        result.detection.box.bottomRight
      ).draw(canvas);
    });

    const view = convertFaceDetectionsToObject(resizedDetections, {
      height: canvas.height,
      width: canvas.width,
    });
    return facesToText(view);
  };

  const display = async () => {
    const video = setRefs();
    const canvas = canvasRef.current;
    // Make Detections
    const obj = await net.detect(video);

    // Draw mesh
    const ctx = canvas.getContext("2d");
    drawRect(obj, ctx);

    const view = convertObjectDetectionsToObject(obj, {
      height: canvas.height,
      width: canvas.width,
    });

    return viewToText(view);
  };

  // find function for find command
  const find = async (objToFind) => {
    const video = setRefs();
    const canvas = canvasRef.current;
    // Make Detections
    const obj = await net.detect(video);

    // Draw mesh
    const ctx = canvas.getContext("2d");
    drawRect(obj, ctx);

    const view = convertObjectDetectionsToObject(obj, {
      height: canvas.height,
      width: canvas.width,
    });
    // Check if the object to find is in the view
    for (const place in view) {
      for (const item of view[place]) {
        if (item === objToFind) return `The ${objToFind} is ${place} of you`;
      }
    }
    return `There is no ${objToFind} in your area`;
  };

  const read = async () => {
    const video = setRefs();
    const canvas = canvasRef.current;

    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const {
      data: { text },
    } = await recognize(canvas, "eng+heb", {
      logger: (m) => console.log(m),
    });
    context.clearRect(0, 0, canvas.width, canvas.height);
    console.log(text);
    return text;
  };

  // loading models
  useEffect(() => {
    loadModels()
      .then(() => console.log("Models loaded."))
      .catch((err) => console.log("Failed to load models.", err));
  }, []);

  // Make sure the device is always listening to new commands
  useEffect(() => {
    if (!listening) SpeechRecognition.startListening();
    if (!transcript) return;

    let command = transcript.split(" ")[0];
    let obj = transcript.split(" ")[1];

    // In case the device support hebrew
    if (command.split("")[0] === "‏") command = command.slice(1);

    switch (command) {
      case "display":
        console.log("displaying...");
        display()
          .then((text) => textToSpeech(text))
          .catch((err) => console.log(err));
        break;
      case "read":
        console.log("reading...");
        read()
          .then((text) => textToSpeech(text))
          .catch((err) => console.log(err));
        break;
      case "describe":
        console.log("describing...");
        describe()
          .then((text) => textToSpeech(text))
          .catch((err) => console.log(err));
        break;
      case "find":
        console.log("finding...");
        find(obj)
          .then((text) => textToSpeech(text))
          .catch((err) => console.log(err));
        break;
      case "help":
        console.log("helping...");
        break;
      default:
        break;
    }
  }, [listening]);

  if (!browserSupportsSpeechRecognition) {
    return <span>Browser doesn't support speech recognition.</span>;
  }

  return (
    <div className="App">
      <Webcam
        ref={webcamRef}
        muted={true}
        style={{
          position: "absolute",
          marginLeft: "auto",
          marginRight: "auto",
          left: 0,
          right: 0,
          textAlign: "center",
          zindex: 9,
          width: 640,
          height: 480,
        }}
      />

      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          marginLeft: "auto",
          marginRight: "auto",
          left: 0,
          right: 0,
          textAlign: "center",
          zindex: 8,
          width: 640,
          height: 480,
        }}
      />
    </div>
  );
}

export default App;
