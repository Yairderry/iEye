import axios from "axios";
import { drawRect, drawFaces } from "./draw";
import { helpText, viewToText, facesToText } from "./texts";
import {
  convertObjectDetectionsToObject,
  convertFaceDetectionsToObject,
} from "./convertDetections";

export const setRefs = (webcamRef, canvasRef) => {
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

export const find = async (objToFind, { canvasRef, webcamRef, net }) => {
  const video = setRefs(webcamRef, canvasRef);
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

export const describe = async ({
  canvasRef,
  webcamRef,
  faceapi,
  labeledImages,
}) => {
  const video = setRefs(webcamRef, canvasRef);
  const canvas = canvasRef.current;
  const displaySize = { width: video.width, height: video.height };
  const faceMatcher = new faceapi.FaceMatcher(labeledImages, 0.8);

  faceapi.matchDimensions(canvas, displaySize);

  const detections = await faceapi
    .detectAllFaces(video)
    .withFaceLandmarks()
    .withFaceExpressions()
    .withAgeAndGender()
    .withFaceDescriptors();

  const resizedDetections = faceapi.resizeResults(detections, displaySize);

  const results = resizedDetections.map((d) => {
    return faceMatcher.findBestMatch(d.descriptor);
  });

  drawFaces(resizedDetections, results, canvas, faceapi);

  const view = convertFaceDetectionsToObject(resizedDetections, results, {
    height: canvas.height,
    width: canvas.width,
  });
  return facesToText(view);
};

export const display = async ({ canvasRef, webcamRef, net }) => {
  const video = setRefs(webcamRef, canvasRef);
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

export const read = async ({ canvasRef, webcamRef, recognize }) => {
  const video = setRefs(webcamRef, canvasRef);
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

export const help = () => {
  return helpText("John");
};

export const loadLabeledImages = async ({ faceapi }) => {
  const { data } = await axios.get(`http://localhost:8080/api/face/labels`);

  return Promise.all(
    data.map(async ({ name, count }) => {
      const descriptions = [];
      for (let i = 1; i <= count; i++) {
        const img = await faceapi.fetchImage(
          `http://localhost:8080/api/face/${name}/${i}`
        );
        const detections = await faceapi
          .detectAllFaces(img)
          .withFaceLandmarks()
          .withFaceDescriptors();
        descriptions.push(detections[0].descriptor);
      }
      return new faceapi.LabeledFaceDescriptors(name, descriptions);
    })
  );
};
