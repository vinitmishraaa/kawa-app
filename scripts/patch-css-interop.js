const fs = require("fs");
const path = require("path");

const targetFile = path.join(
  __dirname,
  "..",
  "node_modules",
  "react-native-css-interop",
  "dist",
  "runtime",
  "native",
  "render-component.js"
);

if (fs.existsSync(targetFile)) {
  let content = fs.readFileSync(targetFile, "utf8");

  // Replace throwing Object.entries in stringify with safe Object.keys
  if (content.includes("for (const entry of Object.entries(value)) {")) {
    content = content.replace(
      /for \(const entry of Object\.entries\(value\)\) \{[\s\S]*?newValue\[entry\[0\]\] = replace\(entry\[0\], entry\[1\]\);[\s\S]*?\}/,
      `for (const key of Object.keys(value)) {
            try {
                newValue[key] = replace(key, value[key]);
            } catch {
                newValue[key] = "[Unreadable]";
            }
        }`
    );
    fs.writeFileSync(targetFile, content, "utf8");
    console.log("[patch-css-interop] Successfully patched react-native-css-interop render-component.js");
  }
}

// Also patch web color-scheme.js to prevent "Cannot manually set color scheme, as dark mode is type 'media'" crash
const webColorSchemeFile = path.join(
  __dirname,
  "..",
  "node_modules",
  "react-native-css-interop",
  "dist",
  "runtime",
  "web",
  "color-scheme.js"
);

if (fs.existsSync(webColorSchemeFile)) {
  let content = fs.readFileSync(webColorSchemeFile, "utf8");
  if (content.includes('throw new Error("Cannot manually set color scheme, as dark mode is type \'media\'')) {
    content = content.replace(
      /if\s*\(darkMode\s*===\s*["']media["']\)\s*\{[\s\S]*?throw new Error\([^)]+\);\s*\}/,
      `if (darkMode === "media") { return; }`
    );
    fs.writeFileSync(webColorSchemeFile, content, "utf8");
    console.log("[patch-css-interop] Successfully patched react-native-css-interop web/color-scheme.js");
  }
}

// Patch Metro FallbackWatcher to ignore Windows UNKNOWN (errno -4094) errors during filesystem crawl
const metroWatcherFiles = [
  path.join(__dirname, "..", "node_modules", "@expo", "metro-file-map", "build", "watchers", "FallbackWatcher.js"),
  path.join(__dirname, "..", "node_modules", "metro-file-map", "src", "watchers", "FallbackWatcher.js"),
];

for (const metroFile of metroWatcherFiles) {
  if (fs.existsSync(metroFile)) {
    let watcherContent = fs.readFileSync(metroFile, "utf8");
    if (!watcherContent.includes("error.errno === -4094") && !watcherContent.includes("error.code === 'UNKNOWN'")) {
      watcherContent = watcherContent.replace(
        /function isIgnorableFileError\(error\)\s*\{[\s\S]*?return\s*\(([\s\S]*?)\);?\s*\}/,
        `function isIgnorableFileError(error) {
    return ($1 || (error.code === 'UNKNOWN' && platform === 'win32') || (error.errno === -4094 && platform === 'win32') || (error.code === 'EPERM' && platform === 'win32'));
}`
      );
      fs.writeFileSync(metroFile, watcherContent, "utf8");
      console.log(`[patch] Successfully patched Metro FallbackWatcher at ${metroFile}`);
    }
  }
}


