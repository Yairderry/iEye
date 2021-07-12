require("dotenv").config();
const Readable = require("stream").Readable;
const { RevAiStreamingClient, AudioConfig } = require("revai-node-sdk");
const { Router } = require("express");
const speech = Router();

// Initialize your client with your revai access token
const accessToken = process.env.REV_AI_ACCESS_TOKEN;
const audioConfig = new AudioConfig(
  "audio/x-wav",
  "interleaved",
  16000,
  "S16LE",
  1
);

speech.post("/", (req, res) => {
  const { base64 } = req.body;
  const audio = Buffer.from(base64, "base64");

  const s = new Readable();
  s.push(audio);
  s.push(null);

  const client = new RevAiStreamingClient(accessToken, audioConfig);

  // Create your event responses
  client.on("close", (code, reason) => {
    console.log(`Connection closed, ${code}: ${reason}`);
  });

  client.on("httpResponse", (code) => {
    console.log(`Streaming client received http response with code: ${code}`);
  });

  client.on("connectFailed", (error) => {
    console.log(`Connection failed with error: ${error}`);
  });

  client.on("connect", (connectionMessage) => {
    console.log(`Connected with job id: ${connectionMessage.id}`);
  });

  const stream = client.start();

  stream.on("data", (data) => {
    if (data?.type === "final")
      res.send(data.elements.map(({ value }) => value).join(""));
  });
  stream.on("end", function () {
    console.log("End of Stream");
  });

  s.on("end", () => {
    client.end();
  });

  s.pipe(stream);
});

module.exports = speech;
