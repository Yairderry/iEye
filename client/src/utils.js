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

export const findCenterOfMass = (detections, videoDims) => {
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

export const arrayCompare = (_arr1, _arr2) => {
  if (
    !Array.isArray(_arr1) ||
    !Array.isArray(_arr2) ||
    _arr1.length !== _arr2.length
  ) {
    return false;
  }

  // .concat() to not mutate arguments
  const arr1 = _arr1.concat().sort();
  const arr2 = _arr2.concat().sort();

  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) {
      return false;
    }
  }

  return true;
};
