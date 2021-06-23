export const drawRect = (detections, ctx) => {
  // Loop through each prediction
  detections.forEach((prediction) => {
    // Extract boxes and classes
    const [x, y, width, height] = prediction["bbox"];
    const text = prediction["class"];

    // Set styling
    const color = "orange";
    ctx.strokeStyle = color;
    ctx.font = "18px Arial";

    // Draw rectangles and text
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    ctx.rect(x, y, width, height);
    ctx.stroke();
  });
};

export const drawFaces = (detections, canvas, faceapi) => {
  canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  faceapi.draw.drawDetections(canvas, detections);
  faceapi.draw.drawFaceLandmarks(canvas, detections);
  faceapi.draw.drawFaceExpressions(canvas, detections);
  detections.forEach((result) => {
    const { age, gender, genderProbability } = result;
    new faceapi.draw.DrawTextField(
      [
        `${Math.round(age, 0)} years`,
        `${gender} (${Math.round(genderProbability)})`,
      ],
      result.detection.box.bottomRight
    ).draw(canvas);
  });
};
