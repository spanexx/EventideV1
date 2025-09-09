# Finding TODO Comments

This command searches for all TODO comments in the codebase and creates a task list from them.

## Search for TODO comments in the entire project

```bash
# Search for TODO comments in all files
grep -r "TODO" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist

# Search for TODO comments with line numbers
grep -rn "TODO" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist

# Search for different variations of TODO comments
grep -rn -E "(TODO|FIXME|HACK|NOTE)" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist
```

## Create a TODO list file from found comments

```bash
# Create a TODO.md file with all TODO comments
grep -rn "TODO" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist > TODO.md

# Create a more structured TODO list
echo "# Project TODO List\n" > TODO.md
echo "Generated on: $(date)\n" >> TODO.md
grep -rn "TODO" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist | sed 's/^/- /' >> TODO.md
```

## Using ripgrep (if available) for faster searching

```bash
# Install ripgrep if not already installed
# npm install -g ripgrep

# Search for TODO comments with ripgrep (much faster)
rg "TODO" .

# Search for multiple patterns
rg -E "(TODO|FIXME|HACK|NOTE)" .

# Search and create formatted output
rg "TODO" . --heading --line-number
```