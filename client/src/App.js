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

// importing custom functions
import { find, help, describe, display, read } from "./utils/actions";
import { textToSpeech } from "./utils/texts";

function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  const [net, setNet] = useState();
  const [answer, setAnswer] = useState(false);

  let { transcript, listening, browserSupportsSpeechRecognition } =
    useSpeechRecognition();

  const loadModels = async () => {
    setAnswer(true);
    const [loadedCocoNet] = await Promise.all([
      cocossd.load(),
      faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
      faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
      faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
      faceapi.nets.faceExpressionNet.loadFromUri("/models"),
      faceapi.nets.ageGenderNet.loadFromUri("./models"),
    ]);
    setNet(loadedCocoNet);
    setAnswer(false);
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
    if (answer) return;

    let command = transcript.split(" ")[0];
    let obj = transcript.split(" ")[1];

    // In case the object consists of two words
    if (transcript.split(" ")[2] !== undefined)
      obj = transcript.split(" ")[1] + " " + transcript.split(" ")[2];

    // In case the device support hebrew
    if (command.split("")[0] === "‏") command = command.slice(1);

    switch (command) {
      case "display":
        console.log("displaying...");
        setAnswer(true);
        display({ canvasRef, webcamRef, net })
          .then((text) => textToSpeech(text, setAnswer))
          .catch((err) => console.log(err));
        break;
      case "read":
        console.log("reading...");
        setAnswer(true);
        read({ canvasRef, webcamRef, recognize })
          .then((text) => textToSpeech(text, setAnswer))
          .catch((err) => console.log(err));
        break;
      case "describe":
        console.log("describing...");
        setAnswer(true);
        describe({ canvasRef, webcamRef, faceapi })
          .then((text) => textToSpeech(text, setAnswer))
          .catch((err) => console.log(err));
        break;
      case "find":
        console.log("finding...");
        setAnswer(true);
        find(obj, { canvasRef, webcamRef, net })
          .then((text) => textToSpeech(text, setAnswer))
          .catch((err) => console.log(err));
        break;
      case "help":
        console.log("helping...");
        setAnswer(true);
        const helpLines = help();
        for (let i = 0; i < helpLines.length; i++)
          textToSpeech(helpLines[i], setAnswer);
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
