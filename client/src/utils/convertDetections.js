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
