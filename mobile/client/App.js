import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import { Text, Button, Overlay } from "react-native-elements";
import Svg, { Rect, Text as SVGText } from "react-native-svg";
import { Camera } from "expo-camera";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-react-native";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import axios from "axios";
import { getDisplay, getFaces, getText } from "./utils/detections";
import Label from "./components/Label";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { PRIVATE_IP } from "@env";
import {
  convertObjectDetectionsToObject,
  convertFaceDetectionsToObject,
} from "./utils/convertDetections";
import { textToSpeech, viewToText, facesToText } from "./utils/texts";

let recording = new Audio.Recording();

export default function App() {
  const [text, setText] = useState("");
  const [transcript, setTranscript] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAnswering, setIsAnswering] = useState(false);
  const [detections, setDetections] = useState([]);
  const [isTfReady, setIsTfReady] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [cocoSsdModel, setCocoSsdModel] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [status, setStatus] = useState("Loading Model...");
  const [type, setType] = useState(Camera.Constants.Type.back);
  const cameraRef = useRef();

  const startRecording = async () => {
    try {
      recording = new Audio.Recording();
      console.log("[+] Created New Recording");
      await recording.prepareToRecordAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
      await recording.startAsync();
      setIsRecording(true);
      console.log("[+] Started Recording");
    } catch (error) {
      console.log(error);
    }
  };

  const stopRecording = async () => {
    try {
      await recording.stopAndUnloadAsync();
      console.log("[+] Stopped Recording");
      const uri = recording.getURI();
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: "base64",
      });
      console.log("[+] Converting Speech To Text");
      const { data } = await axios.post(
        `http://${PRIVATE_IP}:8080/api/speech`,
        {
          base64,
        }
      );
      setTranscript(data);
      setIsRecording(false);
    } catch (error) {
      console.log(error);
    }
  };

  const flip = () => {
    setType(
      type === Camera.Constants.Type.back
        ? Camera.Constants.Type.front
        : Camera.Constants.Type.back
    );
    setDetections([]);
  };

  const detect = async (action) => {
    setStatus("Predicting Image...");
    setIsLoading(true);
    try {
      const data =
        action === "display"
          ? await getDisplay(cameraRef.current, cocoSsdModel)
          : action === "text"
          ? await getText(cameraRef.current)
          : await getFaces(cameraRef.current);

      action === "text" ? setText(data) : setDetections(data);

      // convert data to correct format to read
      const viewObject =
        action === "display"
          ? convertObjectDetectionsToObject(data, { width: 400, height: 400 })
          : action === "faces"
          ? convertFaceDetectionsToObject(data, { width: 400, height: 400 })
          : data;

      const linesToRead =
        action === "display"
          ? viewToText(viewObject)
          : action === "faces"
          ? facesToText(viewObject)
          : data;

      textToSpeech(linesToRead, setIsAnswering);

      setIsLoading(false);
    } catch (error) {
      console.log(error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      if (!isTfReady) {
        console.log("[+] Loading TF Model");
        setStatus("Loading Model...");
        setIsLoading(true);
        let { status } = await Camera.requestPermissionsAsync();
        let audioPermissionsStatus = (await Audio.requestPermissionsAsync())
          .status;
        setHasPermission(
          status === "granted" && audioPermissionsStatus === "granted"
        );
        await tf.ready();
        setIsTfReady(true);
        const model = await cocoSsd.load();
        setCocoSsdModel(model);
        setIsLoading(false);
        console.log("[+] TF Model Loaded");
      }
    })();
  }, [isTfReady]);

  useEffect(() => {
    if (!transcript) return;

    const words = transcript.split(" ");
    const command = words[0];

    switch (command) {
      case "Display":
        console.log("Displaying...");
        detect("display");
        break;
      case "Read":
        console.log("Reading...");
        detect("text");
        break;
      case "Describe":
        console.log("Describing...");
        detect("faces");
        break;
      case "Save":
        console.log("Saving...");
        break;
      case "Find":
        console.log("Finding...");
        break;
      case "Help":
        console.log("Helping...");
        break;
      default:
        break;
    }
  }, [transcript]);

  return (
    <View style={styles.container}>
      {/* loading screen */}
      <Overlay
        isVisible={isLoading}
        fullScreen={true}
        overlayStyle={{ alignItems: "center", justifyContent: "center" }}
      >
        <View>
          <Text style={{ marginBottom: 10 }}>{status}</Text>
          <ActivityIndicator size="large" color="lightblue" />
        </View>
      </Overlay>
      {/* display face and object detections */}
      <View style={{ width: 400, height: 400, position: "relative" }}>
        <Camera
          style={styles.display}
          ratio="1:1"
          type={type}
          ref={cameraRef}
        />
        <Svg height="400" width="400" style={styles.display}>
          {detections.map((detection, i) => (
            <>
              <Rect
                key={`rect${i}`}
                x={
                  detection?.bbox
                    ? type === Camera.Constants.Type.back
                      ? detection?.bbox[0]
                      : 400 - detection?.bbox[0] - detection?.bbox[2]
                    : type === Camera.Constants.Type.back
                    ? detection.detection?._box?._x
                    : 400 -
                      detection.detection?._box?._x -
                      detection.detection?._box?._width
                }
                y={
                  detection?.bbox
                    ? detection?.bbox[1]
                    : detection.detection?._box?._y
                }
                width={
                  detection?.bbox
                    ? detection?.bbox[2]
                    : detection.detection?._box?._width
                }
                height={
                  detection?.bbox
                    ? detection?.bbox[3]
                    : detection.detection?._box?._height
                }
                stroke="red"
                strokeWidth="1"
              />
              {detection?.bbox && (
                <SVGText
                  key={`text-${i}`}
                  fill="red"
                  stroke="black"
                  fontSize="17"
                  fontWeight="bold"
                  x={
                    type === Camera.Constants.Type.back
                      ? detection?.bbox[0]
                      : 400 - detection?.bbox[0] - detection?.bbox[2]
                  }
                  y={detection?.bbox[1]}
                  textAnchor="start"
                >
                  {detection?.class}
                </SVGText>
              )}
              {detection?.faceMatcher?._label && (
                <Label
                  key={`name-${i}`}
                  type={type}
                  detection={detection}
                  labelType="name"
                  textAnchor="start"
                />
              )}
              {detection?.age && (
                <Label
                  key={`age-${i}`}
                  type={type}
                  detection={detection}
                  labelType="age"
                  textAnchor="start"
                />
              )}
              {detection?.gender && (
                <Label
                  key={`gender-${i}`}
                  type={type}
                  detection={detection}
                  labelType="gender"
                  textAnchor="start"
                />
              )}
              {detection?.expressions &&
                Object.entries(detection?.expressions)
                  .filter((expression) => expression[1] >= 0.2)
                  .map((expression, index) => (
                    <SVGText
                      key={`expressions-${index}`}
                      fill="red"
                      stroke="black"
                      fontSize="17"
                      fontWeight="bold"
                      x={
                        type === Camera.Constants.Type.back
                          ? detection.detection?._box?._x +
                            detection.detection?._box?._width
                          : 400 - detection.detection?._box?._x
                      }
                      y={
                        detection.detection?._box?._y +
                        detection.detection?._box?._height +
                        16 * (index + 1)
                      }
                      textAnchor="end"
                    >
                      {expression[0]}
                    </SVGText>
                  ))}
            </>
          ))}
        </Svg>
      </View>
      {/* buttons*/}
      <View style={{ flexDirection: "row", padding: 5 }}>
        <View style={{ flex: 1, padding: 5 }}>
          <Button title="Display" onPress={() => detect("display")} />
        </View>
        <View style={{ flex: 1, padding: 5 }}>
          <Button title="Read" onPress={() => detect("text")} />
        </View>
        <View style={{ flex: 1, padding: 5 }}>
          <Button title="Faces" onPress={() => detect("faces")} />
        </View>
        <View style={{ flex: 1, padding: 5 }}>
          <Button
            title={isRecording ? "Stop Recording" : "Start Recording"}
            onPress={() => {}}
            onPressOut={stopRecording}
            onPressIn={startRecording}
          />
        </View>
        <View style={{ flex: 1, padding: 5 }}>
          <Button title="Flip" onPress={flip} />
        </View>
      </View>
      {/* display detected text */}
      <View style={{ flexDirection: "column", padding: 5 }}>
        <Text>{text}</Text>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
  display: {
    flex: 1,
    position: "absolute",
    width: 400,
    height: 400,
    top: 0,
    left: 0,
  },
});
