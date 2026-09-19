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
