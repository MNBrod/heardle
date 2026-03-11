const fs = require("fs");
const path = require("path");
const { PassThrough } = require("stream");
const ffmpeg = require("fluent-ffmpeg");
const { getConfig } = require("../config/config");

function getFullStream(filePath) {
  const output = new PassThrough();
  ffmpeg(filePath)
    .noVideo()
    .format("mp3")
    .on("error", (error) => output.emit("error", error))
    .pipe(output, { end: true });
  return output;
}

function getM4aStartOffset(filePath) {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return resolve(0);
      const tags = metadata?.format?.tags ?? {};
      const itunSmpb = tags["iTunSMPB"] ?? tags["itunsmpb"];
      if (!itunSmpb) return resolve(0);
      // Format: "00000000 <pre-gap-hex> <post-gap-hex> <total-hex> ..."
      const parts = itunSmpb.trim().split(/\s+/);
      if (parts.length < 2) return resolve(0);
      const preGapSamples = parseInt(parts[1], 16);
      const audioStream = metadata?.streams?.find((s) => s.codec_type === "audio");
      const sampleRate = audioStream?.sample_rate ?? 44100;
      resolve(preGapSamples / sampleRate);
    });
  });
}

async function getSnippetStream(filePath, index) {
  const config = getConfig();
  const durations = config.game.snippetDurations || [1];
  const duration = durations[Math.min(index, durations.length - 1)];
  const fadeIn = config.audio.fadeIn || 0;
  const fadeOut = config.audio.fadeOut || 0;

  const ext = path.extname(filePath).replace(".", "").toLowerCase();
  const startTime = ext === "m4a" ? await getM4aStartOffset(filePath) : 0;
  if (startTime > 0) {
    console.log(`[audioService] m4a start offset for ${path.basename(filePath)}: ${startTime.toFixed(4)}s`);
  }

  const output = new PassThrough();
  const filters = [];
  if (fadeIn > 0) {
    filters.push(`afade=t=in:st=0:d=${fadeIn}`);
  }
  if (fadeOut > 0 && duration > fadeOut) {
    filters.push(`afade=t=out:st=${duration - fadeOut}:d=${fadeOut}`);
  }

  ffmpeg(filePath)
    .setStartTime(startTime)
    .duration(duration)
    .noVideo()
    .audioFilters(filters)
    .format("mp3")
    .on("error", (error) => output.emit("error", error))
    .pipe(output, { end: true });

  return {
    contentType: "audio/mpeg",
    stream: output,
  };
}

function getFileExtension(filePath) {
  return path.extname(filePath).replace(".", "").toLowerCase();
}

module.exports = {
  getFullStream,
  getSnippetStream,
  getFileExtension,
};