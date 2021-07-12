import { Text as SVGText } from "react-native-svg";
import React from "react";
import { Camera } from "expo-camera";

export default function Label({ type, detection, labelType, textAnchor }) {
  return (
    <SVGText
      fill="red"
      stroke="black"
      fontSize="17"
      fontWeight="bold"
      x={
        type === Camera.Constants.Type.back
          ? detection.detection?._box?._x
          : 400 -
            detection.detection?._box?._x -
            detection.detection?._box?._width
      }
      y={
        detection.detection?._box?._y +
        (labelType === "name" ? 0 : detection.detection?._box?._height) +
        (labelType === "age" ? 14 : labelType === "gender" ? 30 : 0)
      }
      textAnchor={textAnchor}
    >
      {labelType === "age"
        ? Math.floor(detection[labelType])
        : labelType === "name"
        ? detection?.faceMatcher?._label
        : detection[labelType]}
    </SVGText>
  );
}
