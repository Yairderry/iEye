import axios from "axios";
import { base64ImageToTensor, resizeImage } from "./imageManipulations";
import { PRIVATE_IP } from "@env";

export const getDisplay = async (camera, cocoSsdModel) => {
  if (!camera) throw new Error("Can't detect any cameras");
  console.log("[+] Analysing Photo");
  const photo = await camera.takePictureAsync({
    skipProcessing: true,
  });
  const image = await resizeImage(photo.uri, 400, 400);
  const imageTensor = base64ImageToTensor(image.base64);
  const detections = await cocoSsdModel.detect(imageTensor);
  console.log("[+] Photo Analysed");
  return detections;
};

export const getText = async (camera) => {
  if (!camera) throw new Error("Can't detect any cameras");
  console.log("[+] Analysing Photo");
  const photo = await camera.takePictureAsync({
    skipProcessing: true,
  });
  const image = await resizeImage(photo.uri, 400, 400);
  const { data } = await axios.post(`http://${PRIVATE_IP}:8080/api/text`, {
    base64: image.base64,
  });
  console.log("[+] Photo Analysed");
  return data;
};

export const getFaces = async (camera) => {
  if (!camera) throw new Error("Can't detect any cameras");
  console.log("[+] Analysing Photo");
  const photo = await camera.takePictureAsync({
    skipProcessing: true,
  });
  const image = await resizeImage(photo.uri, 400, 400);
  const { data } = await axios.post(`http://${PRIVATE_IP}:8080/api/face`, {
    base64: image.base64,
  });
  console.log("[+] Photo Analysed");
  return data;
};
