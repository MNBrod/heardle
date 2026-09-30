const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const { EventEmitter } = require("events");

const configEvents = new EventEmitter();

const defaultConfig = {
  server: {
    port: 3000,
    host: "localhost",
  },
  audio: {
    libraryPath: "",
    supportedFormats: ["mp3", "flac", "m4a", "wav"],
    organizationStructure: "artist/album",
    fadeIn: 0.5,
    fadeOut: 0.5,
  },
  game: {
    snippetDurations: [1, 2, 4, 7, 11, 16],
    maxAttempts: 6,
    dailyPuzzle: true,
    allowSkips: true,
  },
  filters: {
    enableArtistFilter: true,
    enableAlbumFilter: true,
    enableGenreFilter: true,
    enableDecadeFilter: true,
  },
  ui: {
    backgroundColor: "slate",
    title: "Heardle Clone",
    subtitle: "Guess the song from short audio snippets.",
  },
};

// Allowed values for ui.backgroundColor. All are dark so the light text stays readable.
const BACKGROUND_COLORS = {
  slate: "#020617",
  navy: "#0b1733",
  forest: "#0a1f16",
  plum: "#1e0b24",
  burgundy: "#260a10",
};

const configDir = path.join(__dirname, "..", "..");
const jsonPath = path.join(configDir, "config.json");
const yamlPath = path.join(configDir, "config.yaml");

function deepMerge(target, source) {
  if (!source) return target;
  const result = { ...target };
  for (const [key, value] of Object.entries(source)) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      typeof result[key] === "object"
    ) {
      result[key] = deepMerge(result[key], value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

function readConfigFile() {
  if (fs.existsSync(yamlPath)) {
    const raw = fs.readFileSync(yamlPath, "utf8");
    return yaml.load(raw);
  }
  if (fs.existsSync(jsonPath)) {
    const raw = fs.readFileSync(jsonPath, "utf8");
    return JSON.parse(raw);
  }
  return null;
}

function validateConfig(config) {
  const errors = [];
  if (!config.audio || !config.audio.libraryPath) {
    errors.push("audio.libraryPath is required");
  }
  if (!config.game || !Array.isArray(config.game.snippetDurations)) {
    errors.push("game.snippetDurations must be an array");
  }
  if (!BACKGROUND_COLORS[config.ui?.backgroundColor]) {
    errors.push(
      `ui.backgroundColor must be one of: ${Object.keys(BACKGROUND_COLORS).join(", ")} (falling back to slate)`
    );
  }
  return errors;
}

// The resolved values the frontend renders, with the color as a hex code.
function getUiSettings() {
  const ui = currentConfig.ui ?? {};
  return {
    backgroundColor: BACKGROUND_COLORS[ui.backgroundColor] || BACKGROUND_COLORS.slate,
    title: typeof ui.title === "string" ? ui.title : defaultConfig.ui.title,
    subtitle: typeof ui.subtitle === "string" ? ui.subtitle : defaultConfig.ui.subtitle,
  };
}

let currentConfig = deepMerge(defaultConfig, readConfigFile());

const validationErrors = validateConfig(currentConfig);
if (validationErrors.length) {
  console.warn("Config validation warnings:", validationErrors.join("; "));
}

function reloadConfig() {
  currentConfig = deepMerge(defaultConfig, readConfigFile());
  configEvents.emit("change", currentConfig);
}

function watchConfig() {
  const watchedPath = fs.existsSync(yamlPath) ? yamlPath : jsonPath;
  if (!fs.existsSync(watchedPath)) return;
  fs.watch(watchedPath, { persistent: false }, () => {
    try {
      reloadConfig();
    } catch (error) {
      console.error("Failed to reload config:", error.message);
    }
  });
}

function getConfig() {
  return currentConfig;
}

function updateConfig(partial) {
  currentConfig = deepMerge(currentConfig, partial);
  fs.writeFileSync(jsonPath, JSON.stringify(currentConfig, null, 2));
  configEvents.emit("change", currentConfig);
  return currentConfig;
}

module.exports = {
  getConfig,
  getUiSettings,
  BACKGROUND_COLORS,
  updateConfig,
  watchConfig,
  configEvents,
};