// e2e-analyze.js
// Deep analysis script for end-to-end issue detection across backend & frontend

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(process.cwd());
const ignoreDirs = ["node_modules", "dist", ".git", ".angular"];

// Parse CLI arguments
const args = process.argv.slice(2);
const options = {};

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case "--target":
      options.target = args[++i];
      break;
    case "--issue":
      options.issue = args[++i];
      break;
    case "--out":
      options.out = args[++i];
      break;
  }
}

const targetDir = options.target ? path.resolve(options.target) : projectRoot;
const issue = options.issue || "General analysis";
const outputFile = options.out ? path.resolve(options.out) : null;

// Utility: Recursively read files
function readFiles(dir, files = []) {
  try {
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const stats = fs.statSync(fullPath);

      if (stats.isDirectory() && !ignoreDirs.includes(entry)) {
        readFiles(fullPath, files);
      } else if (entry.endsWith(".ts") || entry.endsWith(".js") || entry.endsWith(".html")) {
        files.push(fullPath);
      }
    }
  } catch (err) {
    console.warn(`Warning: Could not read directory ${dir}: ${err.message}`);
  }
  return files;
}

// Analysis 1: Detect duplicate logic across files
function findDuplicates(files) {
  const contentMap = new Map();
  const duplicates = [];

  files.forEach((file) => {
    try {
      const content = fs.readFileSync(file, "utf8").replace(/\s+/g, "");
      const hash = content.slice(0, 200);

      if (contentMap.has(hash)) {
        duplicates.push([contentMap.get(hash), file]);
      } else {
        contentMap.set(hash, file);
      }
    } catch (err) {
      console.warn(`Warning: Could not read file ${file}: ${err.message}`);
    }
  });

  return duplicates;
}

// Analysis 2: Detect unlinked services or unused components
function checkUsage(files) {
  const registry = { components: [], services: [], directives: [] };

  files.forEach((file) => {
    try {
      const content = fs.readFileSync(file, "utf8");

      if (/@Component/.test(content)) registry.components.push(file);
      if (/@Injectable/.test(content)) registry.services.push(file);
      if (/@Directive/.test(content)) registry.directives.push(file);
    } catch (err) {
      console.warn(`Warning: Could not read file ${file}: ${err.message}`);
    }
  });

  const unused = {
    services: registry.services.filter(
      (s) => !files.some((f) => {
        try {
          return fs.readFileSync(f, "utf8").includes(path.basename(s, ".ts"));
        } catch {
          return false;
        }
      })
    ),
  };

  return { registry, unused };
}

// Analysis 3: Check for specific issues in settings components
function analyzeSettingsComponents(files) {
  const settingsFiles = files.filter(f =>
    f.includes("settings") && (f.endsWith(".ts") || f.endsWith(".html"))
  );

  const issues = [];

  settingsFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, "utf8");

      // Check for form field population issues
      if (content.includes("FormGroup") || content.includes("formControlName")) {
        // Look for missing subscriptions or data loading
        if (!content.includes("subscribe") && !content.includes("async")) {
          issues.push({
            file,
            issue: "Form fields may not be populated - no observable subscriptions found",
            severity: "Medium",
            suggestion: "Ensure form fields are bound to observables or use async pipe in template"
          });
        }

        // Check for missing OnInit or data loading
        if (!content.includes("ngOnInit") && !content.includes("ionViewWillEnter")) {
          issues.push({
            file,
            issue: "Form may not initialize properly - no lifecycle hooks found",
            severity: "Low",
            suggestion: "Add ngOnInit or similar to load initial data"
          });
        }
      }

      // Check for missing error handling
      if (content.includes("http.") && !content.includes("catchError") && !content.includes("catch")) {
        issues.push({
          file,
          issue: "API calls without error handling",
          severity: "High",
          suggestion: "Add catchError or try-catch blocks for HTTP requests"
        });
      }

    } catch (err) {
      console.warn(`Warning: Could not read file ${file}: ${err.message}`);
    }
  });

  return issues;
}

// Execute
console.log(`📊 Analyzing target: ${targetDir}`);
console.log(`🎯 Issue: ${issue}`);

const files = readFiles(targetDir);
console.log(`📁 Found ${files.length} files to analyze`);

const duplicates = findDuplicates(files);
const usage = checkUsage(files);
const settingsIssues = analyzeSettingsComponents(files);

// Output results
let output = `=== E2E Analysis Report ===
Target: ${targetDir}
Issue: ${issue}
Date: ${new Date().toISOString()}
Files analyzed: ${files.length}

=== Duplicate Logic ===
`;

if (duplicates.length > 0) {
  duplicates.forEach(([file1, file2]) => {
    output += `- ${file1} ↔ ${file2}\n`;
  });
} else {
  output += "No duplicates found.\n";
}

output += `\n=== Unused Services ===
`;
if (usage.unused.services.length > 0) {
  usage.unused.services.forEach(service => {
    output += `- ${service}\n`;
  });
} else {
  output += "No unused services found.\n";
}

output += `\n=== Settings-Specific Issues ===
`;
if (settingsIssues.length > 0) {
  settingsIssues.forEach(issue => {
    output += `❌ ${issue.severity}: ${issue.file}\n`;
    output += `   Issue: ${issue.issue}\n`;
    output += `   Suggestion: ${issue.suggestion}\n\n`;
  });
} else {
  output += "No settings-specific issues found.\n";
}

output += "✅ End-to-End Analysis Complete.\n";

// Console output
console.log(output);

// File output if specified
if (outputFile) {
  fs.writeFileSync(outputFile, output);
  console.log(`📄 Report saved to: ${outputFile}`);
}
