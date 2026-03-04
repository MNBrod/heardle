const fs = require("fs");
const path = require("path");
const { PassThrough } = require("stream");
const ffmpeg = require("fluent-ffmpeg");
const { getConfig } = require("../config/config");

function getRangeStream(filePath, range) {
  const stat = fs.statSync(filePath);
  const total = stat.size;
  if (!range) {
    return {
      status: 200,
      headers: {
        "Content-Length": total,
        "Content-Type": "audio/mpeg",
      },
      stream: fs.createReadStream(filePath),
    };
  }

  const [startStr, endStr] = range.replace(/bytes=/, "").split("-");
  const start = parseInt(startStr, 10);
  const end = endStr ? parseInt(endStr, 10) : total - 1;
  const chunkSize = end - start + 1;

  return {
    status: 206,
    headers: {
      "Content-Range": `bytes ${start}-${end}/${total}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": "audio/mpeg",
    },
    stream: fs.createReadStream(filePath, { start, end }),
  };
}

function getSnippetStream(filePath, index) {
  const config = getConfig();
  const durations = config.game.snippetDurations || [1];
  const duration = durations[Math.min(index, durations.length - 1)];
  const fadeIn = config.audio.fadeIn || 0;
  const fadeOut = config.audio.fadeOut || 0;

  const output = new PassThrough();
  const filters = [];
  if (fadeIn > 0) {
    filters.push(`afade=t=in:st=0:d=${fadeIn}`);
  }
  if (fadeOut > 0 && duration > fadeOut) {
    filters.push(`afade=t=out:st=${duration - fadeOut}:d=${fadeOut}`);
  }

  ffmpeg(filePath)
    .setStartTime(0)
    .duration(duration)
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
  getRangeStream,
  getSnippetStream,
  getFileExtension,
};