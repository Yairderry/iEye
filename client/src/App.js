import "./styles/App.css";
import React, { useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import * as cocossd from "@tensorflow-models/coco-ssd";
import { recognize } from "tesseract.js";
import Webcam from "react-webcam";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { drawRect, findCenterOfMass, viewToText } from "./utils";

function App() {
  const webcamRef = useRef();
  const canvasRef = useRef();
  const [net, setNet] = useState();

  const loadModels = async () => {
    const currentNet = await cocossd.load();
    setNet(currentNet);
  };

  const setRefs = () => {
    if (
      typeof webcamRef.current === "undefined" ||
      webcamRef.current === null ||
      webcamRef.current.video.readyState !== 4
    )
      return setTimeout(setRefs, 10);

    // Get Video Properties
    const videoWidth = webcamRef.current.video.videoWidth;
    const videoHeight = webcamRef.current.video.videoHeight;

    // Set video width
    webcamRef.current.video.width = videoWidth;
    webcamRef.current.video.height = videoHeight;

    // Set canvas height and width
    canvasRef.current.width = videoWidth;
    canvasRef.current.height = videoHeight;
  };

  const textToSpeech = (text) => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.85;
    speechSynthesis.speak(utter);
  };

  const display = async () => {
    const video = webcamRef.current.video;
    const obj = await net.detect(video);

    // Draw detection for development
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    drawRect(obj, ctx);

    const view = findCenterOfMass(obj, {
      height: canvasRef.current.height,
      width: canvasRef.current.width,
    });
    return viewToText(view);
  };

  const read = async () => {
    const video = webcamRef.current.video;
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
    return text;
  };

  let { transcript, listening, browserSupportsSpeechRecognition } =
    useSpeechRecognition();

  useEffect(() => {
    setRefs();
    loadModels()
      .then(() => console.log("models loaded."))
      .catch((err) => console.log(err));
  }, []);

  // Make sure the device is always listening to new commands
  useEffect(() => {
    if (!listening) SpeechRecognition.startListening();
    if (!transcript) return;

    let command = transcript.split(" ")[0];

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
          .then((text) => console.log(text))
          .catch((err) => console.log(err));
        break;
      case "describe":
        console.log("describing...");
        break;
      case "find":
        console.log("finding...");
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
