// src/index.ts
import path5 from "path";

// src/checkers/requiredFilesChecker.ts
import fs from "fs";
import path from "path";
var REQUIRED_FILES = [
  { name: "README.md", key: "readme" },
  { name: "LICENSE", key: "license", aliases: ["LICENSE.txt", "LICENSE.md"] },
  { name: ".gitignore", key: "gitignore" },
  { name: "package.json", key: "package_json" }
];
function checkRequiredFiles(targetDir) {
  const results = [];
  for (const item of REQUIRED_FILES) {
    const mainPath = path.join(targetDir, item.name);
    let found = fs.existsSync(mainPath);
    let foundName = item.name;
    if (!found && item.aliases) {
      for (const alias of item.aliases) {
        if (fs.existsSync(path.join(targetDir, alias))) {
          found = true;
          foundName = alias;
          break;
        }
      }
    }
    if (found) {
      results.push({
        id: `required-${item.key}`,
        name: `${item.name} \u5B58\u5728\u78BA\u8A8D`,
        category: "REQUIRED",
        status: "OK",
        message: `\u691C\u51FA\u3055\u308C\u307E\u3057\u305F (${foundName})`,
        scoreImpact: 0
      });
    } else {
      results.push({
        id: `required-${item.key}`,
        name: `${item.name} \u5B58\u5728\u78BA\u8A8D`,
        category: "REQUIRED",
        status: "MISSING",
        message: `\u5FC5\u9808\u30D5\u30A1\u30A4\u30EB ${item.name} \u304C\u5B58\u5728\u3057\u307E\u305B\u3093`,
        scoreImpact: -20
      });
    }
  }
  return results;
}

// src/checkers/recommendedFilesChecker.ts
import fs2 from "fs";
import path2 from "path";
var RECOMMENDED_ITEMS = [
  { name: "CHANGELOG.md", key: "changelog", aliases: ["CHANGELOG", "CHANGELOG.txt"] },
  { name: "CONTRIBUTING.md", key: "contributing", aliases: ["CONTRIBUTING", "CONTRIBUTING.txt"] },
  { name: "docs \u30D5\u30A9\u30EB\u30C0", key: "docs", isDir: true, pathName: "docs" }
];
function checkRecommendedFiles(targetDir) {
  const results = [];
  for (const item of RECOMMENDED_ITEMS) {
    if (item.isDir) {
      const dirPath = path2.join(targetDir, item.pathName);
      const exists = fs2.existsSync(dirPath) && fs2.statSync(dirPath).isDirectory();
      if (exists) {
        results.push({
          id: `recommended-${item.key}`,
          name: `${item.name} \u5B58\u5728\u78BA\u8A8D`,
          category: "RECOMMENDED",
          status: "OK",
          message: `\u691C\u51FA\u3055\u308C\u307E\u3057\u305F (${item.pathName}/)`,
          scoreImpact: 0
        });
      } else {
        results.push({
          id: `recommended-${item.key}`,
          name: `${item.name} \u5B58\u5728\u78BA\u8A8D`,
          category: "RECOMMENDED",
          status: "WARNING",
          message: `\u63A8\u5968 ${item.name} \u304C\u3042\u308A\u307E\u305B\u3093\uFF08\u4EFB\u610F\uFF09`,
          scoreImpact: -5
        });
      }
    } else {
      const mainPath = path2.join(targetDir, item.name);
      let found = fs2.existsSync(mainPath);
      let foundName = item.name;
      if (!found && item.aliases) {
        for (const alias of item.aliases) {
          if (fs2.existsSync(path2.join(targetDir, alias))) {
            found = true;
            foundName = alias;
            break;
          }
        }
      }
      if (found) {
        results.push({
          id: `recommended-${item.key}`,
          name: `${item.name} \u5B58\u5728\u78BA\u8A8D`,
          category: "RECOMMENDED",
          status: "OK",
          message: `\u691C\u51FA\u3055\u308C\u307E\u3057\u305F (${foundName})`,
          scoreImpact: 0
        });
      } else {
        results.push({
          id: `recommended-${item.key}`,
          name: `${item.name} \u5B58\u5728\u78BA\u8A8D`,
          category: "RECOMMENDED",
          status: "WARNING",
          message: `\u63A8\u5968\u30D5\u30A1\u30A4\u30EB ${item.name} \u304C\u3042\u308A\u307E\u305B\u3093\uFF08\u4EFB\u610F\uFF09`,
          scoreImpact: -5
        });
      }
    }
  }
  return results;
}

// src/checkers/ignoredFilesChecker.ts
import fs3 from "fs";
import path3 from "path";
var UNWANTED_PATTERNS = [
  "node_modules",
  "temp",
  "cache",
  ".log",
  ".tmp",
  ".env",
  ".DS_Store",
  "Thumbs.db"
];
var DEFAULT_LARGE_FILE_THRESHOLD = 10 * 1024 * 1024;
function scanUnwantedAndLargeFiles(targetDir, largeFileThresholdBytes = DEFAULT_LARGE_FILE_THRESHOLD) {
  const unwantedFiles = [];
  const largeFiles = [];
  function scan(dirPath) {
    const entries = fs3.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path3.join(dirPath, entry.name);
      const relativePath = path3.relative(targetDir, fullPath);
      if (entry.name === ".git") continue;
      const isUnwanted = UNWANTED_PATTERNS.some((pattern) => {
        if (pattern.startsWith(".")) {
          return entry.name.endsWith(pattern);
        }
        return entry.name.toLowerCase() === pattern.toLowerCase();
      });
      if (isUnwanted) {
        unwantedFiles.push(relativePath);
        if (entry.isDirectory()) continue;
      }
      if (entry.isDirectory()) {
        scan(fullPath);
      } else if (entry.isFile()) {
        try {
          const stats = fs3.statSync(fullPath);
          if (stats.size >= largeFileThresholdBytes) {
            largeFiles.push({
              path: relativePath,
              sizeBytes: stats.size
            });
          }
        } catch {
        }
      }
    }
  }
  scan(targetDir);
  return {
    unwantedFiles,
    largeFiles
  };
}

// src/reporter/consoleReporter.ts
function printConsoleReport(report) {
  console.log("\n========================================");
  console.log("\u{1F50D} GitHub\u516C\u958B\u524D\u30C1\u30A7\u30C3\u30AF \u30EC\u30DD\u30FC\u30C8");
  console.log("========================================\n");
  console.log(`\u5BFE\u8C61\u30D1\u30B9: ${report.targetPath}`);
  console.log(`\u8A3A\u65AD\u65E5\u6642: ${report.checkedAt}
`);
  console.log("--- \u3010\u57FA\u672C\u30C1\u30A7\u30C3\u30AF\u9805\u76EE\u3011 ---");
  for (const item of report.items) {
    const statusMark = item.status === "OK" ? "\u2705 OK" : item.status === "WARNING" ? "\u26A0\uFE0F  WARN" : "\u274C MISSING";
    console.log(`${item.name.padEnd(20)} ${statusMark.padEnd(10)} ${item.message}`);
  }
  if (report.unwantedFilesFound.length > 0) {
    console.log("\n--- \u26A0\uFE0F \u691C\u51FA\u3055\u308C\u305F\u4E0D\u8981\u30D5\u30A1\u30A4\u30EB/\u30D5\u30A9\u30EB\u30C0 ---");
    for (const file of report.unwantedFilesFound) {
      console.log(`  - ${file}`);
    }
  } else {
    console.log("\n--- \u26A0\uFE0F \u4E0D\u8981\u30D5\u30A1\u30A4\u30EB ---");
    console.log("  \u306A\u3057 (\u30AF\u30EA\u30FC\u30F3)");
  }
  if (report.largeFilesFound.length > 0) {
    console.log("\n--- \u{1F418} \u691C\u51FA\u3055\u308C\u305F\u5927\u5BB9\u91CF\u30D5\u30A1\u30A4\u30EB (> 10MB) ---");
    for (const file of report.largeFilesFound) {
      const sizeMB = (file.sizeBytes / (1024 * 1024)).toFixed(2);
      console.log(`  - ${file.path} (${sizeMB} MB)`);
    }
  }
  console.log("\n========================================");
  console.log(`\u7DCF\u5408\u8A55\u4FA1\u30B9\u30B3\u30A2: ${report.totalScore} / ${report.maxScore}`);
  console.log("========================================\n");
}

// src/reporter/markdownReporter.ts
import fs4 from "fs";
import path4 from "path";
function generateMarkdownReport(report) {
  const lines = [];
  lines.push("# \u{1F50D} GitHub \u516C\u958B\u524D\u30C1\u30A7\u30C3\u30AF \u30EC\u30DD\u30FC\u30C8");
  lines.push("");
  lines.push(`- **\u8A3A\u65AD\u5BFE\u8C61\u30D1\u30B9**: \`${report.targetPath}\``);
  lines.push(`- **\u8A3A\u65AD\u65E5\u6642**: ${report.checkedAt}`);
  lines.push(`- **\u7DCF\u5408\u8A55\u4FA1\u30B9\u30B3\u30A2**: **${report.totalScore} / ${report.maxScore}**`);
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("## \u{1F4CB} \u57FA\u672C\u30C1\u30A7\u30C3\u30AF\u9805\u76EE");
  lines.push("");
  lines.push("| \u72B6\u614B | \u9805\u76EE\u540D | \u30E1\u30C3\u30BB\u30FC\u30B8 | \u30B9\u30B3\u30A2\u5F71\u97FF |");
  lines.push("| :--- | :--- | :--- | :--- |");
  for (const item of report.items) {
    const statusIcon = item.status === "OK" ? "\u2705 OK" : item.status === "WARNING" ? "\u26A0\uFE0F WARN" : "\u274C MISSING";
    const impact = item.scoreImpact > 0 ? `+${item.scoreImpact}` : `${item.scoreImpact}`;
    lines.push(`| ${statusIcon} | ${item.name} | ${item.message} | ${impact} |`);
  }
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("## \u26A0\uFE0F \u691C\u51FA\u3055\u308C\u305F\u4E0D\u8981\u30D5\u30A1\u30A4\u30EB / \u30D5\u30A9\u30EB\u30C0");
  lines.push("");
  if (report.unwantedFilesFound.length > 0) {
    lines.push("\u4EE5\u4E0B\u306E\u4E0D\u8981\u306A\u30D5\u30A1\u30A4\u30EB\u307E\u305F\u306F\u30D5\u30A9\u30EB\u30C0\u304C\u691C\u51FA\u3055\u308C\u307E\u3057\u305F\u3002\u516C\u958B\u524D\u306B\u524A\u9664\u307E\u305F\u306F `.gitignore` \u3078\u306E\u8FFD\u52A0\u3092\u63A8\u5968\u3057\u307E\u3059\u3002");
    lines.push("");
    for (const file of report.unwantedFilesFound) {
      lines.push(`- \`${file}\``);
    }
  } else {
    lines.push("\u691C\u51FA\u3055\u308C\u305F\u4E0D\u8981\u30D5\u30A1\u30A4\u30EB\u306F\u3042\u308A\u307E\u305B\u3093\u3002\uFF08\u30AF\u30EA\u30FC\u30F3\uFF09");
  }
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("## \u{1F418} \u691C\u51FA\u3055\u308C\u305F\u5927\u5BB9\u91CF\u30D5\u30A1\u30A4\u30EB");
  lines.push("");
  if (report.largeFilesFound.length > 0) {
    lines.push("\u4EE5\u4E0B\u306E\u5927\u5BB9\u91CF\u30D5\u30A1\u30A4\u30EB\u304C\u691C\u51FA\u3055\u308C\u307E\u3057\u305F\u3002Git LFS \u306E\u4F7F\u7528\u3084\u30EA\u30DD\u30B8\u30C8\u30EA\u5916\u3067\u306E\u7BA1\u7406\u3092\u691C\u8A0E\u3057\u3066\u304F\u3060\u3055\u3044\u3002");
    lines.push("");
    for (const file of report.largeFilesFound) {
      const sizeMB = (file.sizeBytes / (1024 * 1024)).toFixed(2);
      lines.push(`- \`${file.path}\` (${sizeMB} MB)`);
    }
  } else {
    lines.push("\u691C\u51FA\u3055\u308C\u305F\u5927\u5BB9\u91CF\u30D5\u30A1\u30A4\u30EB\u306F\u3042\u308A\u307E\u305B\u3093\u3002");
  }
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("## \u{1F4CA} \u30B5\u30DE\u30EA\u30FC");
  lines.push("");
  lines.push(`- \u5FC5\u9808\u30D5\u30A1\u30A4\u30EB\u5408\u683C\u7387: ${report.summary.passedRequired} / ${report.summary.totalRequired}`);
  lines.push(`- \u63A8\u5968\u30D5\u30A1\u30A4\u30EB\u30AF\u30EA\u30A2\u6570: ${report.summary.passedRecommended} / ${report.summary.totalRecommended}`);
  lines.push(`- \u4E0D\u8981\u30D5\u30A1\u30A4\u30EB\u691C\u51FA\u6570: ${report.summary.unwantedCount}`);
  lines.push("");
  return lines.join("\n");
}
function saveMarkdownReport(report, outputPath) {
  const content = generateMarkdownReport(report);
  const resolvedPath = path4.resolve(outputPath);
  const dir = path4.dirname(resolvedPath);
  if (!fs4.existsSync(dir)) {
    fs4.mkdirSync(dir, { recursive: true });
  }
  fs4.writeFileSync(resolvedPath, content, "utf-8");
}

// src/cli/args.ts
import { parseArgs } from "util";
function parseCLIFlags(args = process.argv.slice(2)) {
  try {
    const { values, positionals } = parseArgs({
      args,
      options: {
        output: {
          type: "string",
          short: "o"
        },
        threshold: {
          type: "string",
          short: "t"
        },
        json: {
          type: "boolean"
        },
        help: {
          type: "boolean",
          short: "h"
        }
      },
      allowPositionals: true
    });
    const targetPath = positionals[0] || ".";
    const outputPath = values.output;
    const jsonOutput = Boolean(values.json);
    const help = Boolean(values.help);
    let largeFileThresholdBytes = void 0;
    if (values.threshold) {
      const mb = parseFloat(values.threshold);
      if (!isNaN(mb) && mb > 0) {
        largeFileThresholdBytes = mb * 1024 * 1024;
      }
    }
    return {
      targetPath,
      outputPath,
      largeFileThresholdBytes,
      jsonOutput,
      help
    };
  } catch (error) {
    console.error("\u26A0\uFE0F  \u5F15\u6570\u306E\u89E3\u6790\u30A8\u30E9\u30FC:", error instanceof Error ? error.message : String(error));
    return {
      targetPath: ".",
      jsonOutput: false,
      help: true
    };
  }
}
function printHelp() {
  console.log(`
\u{1F50D} GitHub \u516C\u958B\u524D\u30C1\u30A7\u30C3\u30AB\u30FC (gh-check)

\u4F7F\u7528\u65B9\u6CD5:
  npx gh-check [targetDir] [options]

\u30AA\u30D7\u30B7\u30E7\u30F3:
  -o, --output <path>    Markdown \u30EC\u30DD\u30FC\u30C8\u3092\u6307\u5B9A\u306E\u30D1\u30B9\u306B\u4FDD\u5B58\u3057\u307E\u3059 (\u4F8B: CHECK_REPORT.md)
  -t, --threshold <mb>   \u5927\u5BB9\u91CF\u30D5\u30A1\u30A4\u30EB\u306E\u691C\u51FA\u95BE\u5024\u3092\u30E1\u30AC\u30D0\u30A4\u30C8\u5358\u4F4D\u3067\u6307\u5B9A\u3057\u307E\u3059 (\u30C7\u30D5\u30A9\u30EB\u30C8: 10)
  --json                 \u7D50\u679C\u3092 JSON \u30D5\u30A9\u30FC\u30DE\u30C3\u30C8\u3067\u6A19\u6E96\u51FA\u529B\u306B\u51FA\u529B\u3057\u307E\u3059
  -h, --help             \u3053\u306E\u30D8\u30EB\u30D7\u30E1\u30C3\u30BB\u30FC\u30B8\u3092\u8868\u793A\u3057\u307E\u3059

\u4F8B:
  npx gh-check .
  npx gh-check ./my-project -o ./CHECK_REPORT.md -t 5
  npx gh-check . --json
`);
}

// src/index.ts
function runChecker(options) {
  const targetDir = path5.resolve(options.targetPath);
  const requiredResults = checkRequiredFiles(targetDir);
  const recommendedResults = checkRecommendedFiles(targetDir);
  const { unwantedFiles, largeFiles } = scanUnwantedAndLargeFiles(
    targetDir,
    options.largeFileThresholdBytes
  );
  const allItems = [...requiredResults, ...recommendedResults];
  let totalScore = 100;
  for (const item of allItems) {
    totalScore += item.scoreImpact;
  }
  if (unwantedFiles.length > 0) {
    totalScore -= Math.min(unwantedFiles.length * 5, 20);
  }
  if (largeFiles.length > 0) {
    totalScore -= Math.min(largeFiles.length * 10, 30);
  }
  totalScore = Math.max(0, totalScore);
  const report = {
    targetPath: targetDir,
    checkedAt: (/* @__PURE__ */ new Date()).toLocaleString("ja-JP"),
    totalScore,
    maxScore: 100,
    items: allItems,
    unwantedFilesFound: unwantedFiles,
    largeFilesFound: largeFiles,
    summary: {
      passedRequired: requiredResults.filter((r) => r.status === "OK").length,
      totalRequired: requiredResults.length,
      passedRecommended: recommendedResults.filter((r) => r.status === "OK").length,
      totalRecommended: recommendedResults.length,
      unwantedCount: unwantedFiles.length
    }
  };
  return report;
}
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("index.ts") || process.argv[1]?.endsWith("index.js")) {
  const cliOptions = parseCLIFlags();
  if (cliOptions.help) {
    printHelp();
  } else {
    const report = runChecker({
      targetPath: cliOptions.targetPath,
      largeFileThresholdBytes: cliOptions.largeFileThresholdBytes
    });
    if (cliOptions.jsonOutput) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      printConsoleReport(report);
    }
    if (cliOptions.outputPath) {
      saveMarkdownReport(report, cliOptions.outputPath);
      console.log(`\u{1F4DD} Markdown \u30EC\u30DD\u30FC\u30C8\u3092\u4FDD\u5B58\u3057\u307E\u3057\u305F: ${cliOptions.outputPath}
`);
    }
  }
}
export {
  runChecker
};
