import * as Speech from "expo-speech";

export const helpText = (userName) => {
  return [
    `Hello ${userName}, this is the help section.`,
    `If you'd like me to display the objects i detected say "display room". I can detect up to 80 objects at the moment.`,
    `If you'd like me to describe the faces i detected say "describe faces". I can detect age, gender and facial expressions at the moment.`,
    `If you'd like me to read the text i detected say "read text". The default languages are English and Hebrew.`,
    `If you'd like me to find a certain object near you say "find" followed by the name of the object.`,
    `If you'd like read you the current settings say "list settings".`,
    `If you'd like change the settings say "set X as Y" where 'X' is the name of the settings and 'Y' is the new value.`,
  ];
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

      return `the one ${
        key === "InFront" ? "in front of you" : `on your ${key}`
      } is probably a ${gender} named ${name}, around the age of ${age} ${
        gender === "male" ? "he" : "she"
      } is ${expressionsText}`;
    });

    text.push(...textLines);
  }
  text.unshift(
    text.length === 1
      ? "there is 1 person in view. "
      : `there are ${text.length} people in view. `
  );
  return text.join(" ");
};

export const textToSpeech = (text, setIsAnswering) => {
  Speech.speak(text, {
    language: "en",
    onDone: () => {
      setIsAnswering(false);
    },
  });
};
