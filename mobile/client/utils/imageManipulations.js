import * as jpeg from "jpeg-js";
import * as tf from "@tensorflow/tfjs";
import * as ImageManipulator from "expo-image-manipulator";

export const base64ImageToTensor = (base64) => {
  //Function to convert jpeg image to tensors
  const rawImageData = tf.util.encodeString(base64, "base64");
  const TO_UINT8ARRAY = true;
  const { width, height, data } = jpeg.decode(rawImageData, TO_UINT8ARRAY);
  // Drop the alpha channel info for mobilenet
  const buffer = new Uint8Array(width * height * 3);
  let offset = 0; // offset into original data
  for (let i = 0; i < buffer.length; i += 3) {
    buffer[i] = data[offset];
    buffer[i + 1] = data[offset + 1];
    buffer[i + 2] = data[offset + 2];
    offset += 4;
  }
  return tf.tensor3d(buffer, [height, width, 3]);
};

export const resizeImage = async (imageUrl, width, height) => {
  const actions = [{ resize: { width, height } }];
  const saveOptions = {
    compress: 0.75,
    format: ImageManipulator.SaveFormat.JPEG,
    base64: true,
  };
  const res = await ImageManipulator.manipulateAsync(
    imageUrl,
    actions,
    saveOptions
  );
  return res;
};
