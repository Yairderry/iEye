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

export const convertObjectDetectionsToObject = (detections, videoDims) => {
  const state = {};

  // Loop through each prediction
  detections.forEach((prediction) => {
    // Find center of mass
    const [left, top, width, height] = prediction["bbox"];
    const [centerX, centerY] = [left + width / 2, top + height / 2];

    // Find it's position relative to the board
    const x = centerX / videoDims.width;
    const xPosition = x >= 2 / 3 ? "Left" : x >= 1 / 3 ? "" : "Right";
    const y = centerY / videoDims.height;
    const yPosition = y >= 2 / 3 ? "Bottom" : y >= 1 / 3 ? "" : "Top";
    const position = xPosition + yPosition;

    // Get object name
    const text = prediction["class"];

    // add to new state
    let location = state[position ? position : "InFront"];

    if (!location) return (state[position ? position : "InFront"] = [text]);

    location.push(text);
  });
  return state;
};

export const convertFaceDetectionsToObject = (detections, videoDims) => {
  const state = {};

  // Loop through each prediction
  detections.forEach(
    ({ detection, age, gender, genderProbability, expressions }) => {
      // Find center of mass
      const { x, y, width, height } = detection.box;
      const [centerX, centerY] = [x + width / 2, y + height / 2];

      // Find it's position relative to the board
      const xRelation = centerX / videoDims.width;
      const xPosition =
        xRelation >= 2 / 3 ? "Left" : xRelation >= 1 / 3 ? "" : "Right";
      const yRelation = centerY / videoDims.height;
      const yPosition =
        yRelation >= 2 / 3 ? "Bottom" : yRelation >= 1 / 3 ? "" : "Top";
      const position = xPosition + yPosition;

      // get age, gender and expression
      const faceData = {
        name: "person",
        age: Math.floor(age),
        gender,
        genderProbability,
        expressions,
      };

      // add to new state
      let location = state[position ? position : "InFront"];

      if (!location)
        return (state[position ? position : "InFront"] = [faceData]);

      location.push(faceData);
    }
  );
  return state;
};

export const viewToText = (view) => {
  const text = [];

  for (const key in view) {
    const labels = view[key];

    if (labels.length <= 0) continue;

    const objects = [];
    labels.forEach((label) => {
      const filteredLabel = objects.find(({ name }) => name === label);

      if (filteredLabel) return filteredLabel.count++;

      objects.push({ name: label, count: 1 });
    });

    const textLines = objects.map(({ name, count }) => `${count} ${name}`);

    textLines.unshift(
      `there ${textLines[0].split(" ")[0] === "1" ? "is" : "are"} `
    );
    textLines.push(key === "InFront" ? "in front of you." : `on your ${key}.`);

    text.push(textLines);
  }
  return text.join(" ");
};

export const facesToText = (faces) => {
  const text = [];

  for (const key in faces) {
    const detections = faces[key];

    if (detections.length <= 0) continue;

    const textLines = detections.map(({ name, age, gender, expressions }) => {
      const likelyExpressions = Object.entries(expressions).filter(
        (expression) => expression[1] > 0.35
      );

      const expressionsText = likelyExpressions.map((expression, i) => {
        const only = likelyExpressions.length === 1;
        const last = likelyExpressions.length - 1 === i;
        const secondToLast = likelyExpressions.length - 2 === i;
        return only
          ? expression[0]
          : secondToLast
          ? `${expression[0]} `
          : last
          ? `and ${expression[0]}.`
          : `${expression[0]}, `;
      });

      return `${gender} ${name} around the age of ${age} ${
        key === "InFront" ? "in front of you." : `on your ${key}.`
      } ${gender === "male" ? "he" : "she"} is ${expressionsText}`;
    });

    textLines.unshift(`there is 1 `);

    text.push(textLines);
  }
  return text.join(" ");
};
