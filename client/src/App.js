import "./App.css";
import React, { useEffect, useState } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

function App() {
  let { transcript, listening, browserSupportsSpeechRecognition } =
    useSpeechRecognition();

  // Make sure the device is always listening to new commands
  useEffect(() => {
    if (!listening) SpeechRecognition.startListening();
    if (!transcript) return;

    let command = transcript.split(" ")[0];
    // In case the device support hebrew
    if (command.split("")[0] === "") command.slice(1);

    switch (command) {
      case "display":
        console.log("display");
        break;

      case "read":
        console.log("read");
        break;

      case "describe":
        console.log("describe");
        break;

      case "find":
        console.log("find");
        break;

      case "help":
        console.log("help");
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
      <div>
        <p>Microphone: {listening ? "on" : "off"}</p>
        <button onClick={SpeechRecognition.startListening}>Start</button>
        <button onClick={SpeechRecognition.stopListening}>Stop</button>
        <p>{transcript}</p>
      </div>
    </div>
  );
}

export default App;
