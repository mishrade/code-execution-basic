# 🚀 Quick Setup Guide - MCP Code Execution Server

## Step-by-Step Implementation Instructions

### Prerequisites Check

```bash
# Check Node.js version (need 18+)
node --version

# Check Python version (need 3.x)
python3 --version

# Check npm
npm --version
```

### Step 1: Install Dependencies

```bash
cd /path/to/mcp-code-execution
npm install
```

**Expected output:**
```
added 92 packages, and audited 93 packages in 7s
found 0 vulnerabilities
```

### Step 2: Build the Project

```bash
npm run build
```

**Expected output:**
```
> mcp-code-execution@1.0.0 build
> tsc
```

**Verify build:**
```bash
ls -la build/
```

You should see:
- `server.js` (main server)
- `server.d.ts` (TypeScript declarations)
- `executor/` directory
- `types/` directory

### Step 3: Test Locally

#### Test 1: Run the log analyzer directly

```bash
python3 examples/analyze-logs.py examples/sample-nginx.log
```

**Expected:** JSON output with log analysis

#### Test 2: Test MCP Server with Inspector

```bash
npm run inspect
```

This opens the MCP Inspector in your browser where you can:
1. See the `execute_code` tool listed
2. Test executing Python code
3. View results in real-time

**Example test in inspector:**
```json
{
  "code": "print('Hello from MCP!')",
  "language": "python"
}
```

### Step 4: Configure Claude Desktop

#### macOS Configuration

```bash
# Open config file
open ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

#### Linux Configuration

```bash
# Open config file
nano ~/.config/Claude/claude_desktop_config.json
```

#### Windows Configuration

```
%APPDATA%\Claude\claude_desktop_config.json
```

#### Add Configuration

```json
{
  "mcpServers": {
    "code-execution": {
      "command": "node",
      "args": [
        "/ABSOLUTE/PATH/TO/mcp-code-execution/build/server.js"
      ]
    }
  }
}
```

**Important:**
- Replace `/ABSOLUTE/PATH/TO/` with your actual path
- Use absolute paths, not relative paths
- Use forward slashes `/` even on Windows
- No trailing slashes

#### Get Absolute Path

```bash
# In the project directory, run:
pwd

# Example output:
# /Users/yourname/projects/mcp-code-execution

# Use this in your config:
# /Users/yourname/projects/mcp-code-execution/build/server.js
```

### Step 4.5: Configure Filesystem Access (CRITICAL)

**Why:** Code execution needs to READ your files. You need TWO servers:
1. **Filesystem server** → Lets Claude see your files
2. **Code execution server** → Lets Python analyze them locally

#### Install Filesystem Server

```bash
# Clone MCP servers repo
git clone https://github.com/modelcontextprotocol/servers.git
cd servers/src/filesystem
npm install
npm run build
```

#### Create Data Directory

```bash
# Create dedicated directory for MCP
mkdir -p ~/mcp-data/logs
mkdir -p ~/mcp-data/reports

# Move your files there
# Example: cp /path/to/billing.csv ~/mcp-data/reports/
```

#### Update Claude Config with BOTH Servers

Replace your entire config with:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "node",
      "args": [
        "/absolute/path/to/servers/src/filesystem/dist/index.js",
        "/Users/yourname/mcp-data"
      ]
    },
    "code-execution": {
      "command": "node",
      "args": [
        "/absolute/path/to/mcp-code-execution/build/server.js"
      ]
    }
  }
}
```

**Important:**
- Replace `/absolute/path/to/` with YOUR actual paths
- Replace `/Users/yourname/mcp-data` with YOUR data directory
- Use `pwd` command to get absolute paths

#### Test Both Servers

Ask Claude:
```
List files in my mcp-data directory
```

Then:
```
Analyze the largest CSV file and show me top 5 insights
```

### Step 5: Restart Claude Desktop

**Complete restart required:**
1. Quit Claude Desktop completely (don't just close window)
2. Reopen Claude Desktop
3. Start a new conversation

### Step 6: Verify Connection

In Claude Desktop, ask:

```
What MCP tools do you have available?
```

You should see:
- `execute_code` - Execute Python code in a secure sandbox
- `read_file` - Read files from allowed directories
- `list_directory` - List files in allowed directories

### Step 7: Test the Demo

#### Test 1: Basic Execution

Ask Claude:
```
Execute this Python code:
print("Hello from MCP code execution!")
print(f"2 + 2 = {2 + 2}")
```

#### Test 2: Log Analysis

Ask Claude:
```
Analyze the nginx log file at examples/sample-nginx.log
Show me error statistics and recommendations
```

#### Test 3: Custom Script

Ask Claude:
```
Run the Python script at examples/analyze-logs.py
and explain the results
```

## 🎯 Token Savings Demo

### Comparison Test

**Without MCP (Traditional):**
1. Open examples/sample-nginx.log
2. Copy all 51 lines
3. Paste into Claude
4. Ask for analysis
5. **Result: ~1,875 tokens used**

**With MCP:**
1. Ask Claude: "Analyze examples/sample-nginx.log"
2. Claude writes Python script (~800 tokens)
3. MCP executes locally (0 tokens for log content!)
4. Returns summary (~500 tokens)
5. **Result: ~1,500 tokens used**

**Savings: 20% reduction** (small file - minimal benefit)

With a 500 KB file:
- Without MCP: ~125,000 tokens
- With MCP: ~1,500 tokens
- **Savings: 99% reduction!**

## 🐛 Troubleshooting

### Problem: MCP server doesn't appear in Claude

**Solution 1:** Check logs
```bash
# macOS
tail -f ~/Library/Logs/Claude/mcp*.log

# Linux
tail -f ~/.local/share/Claude/logs/mcp*.log
```

**Solution 2:** Verify config syntax
```bash
# Validate JSON syntax
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json | python3 -m json.tool
```

**Solution 3:** Check path
```bash
# Verify server.js exists at the configured path
ls -la /your/configured/path/build/server.js
```

### Problem: "python3: command not found"

**macOS:**
```bash
brew install python3
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install python3
```

**Windows:**
Download from https://python.org

### Problem: Build fails

**Solution:**
```bash
# Clean and rebuild
rm -rf build node_modules
npm install
npm run build
```

### Problem: Permission denied

**Solution:**
```bash
chmod +x build/server.js
```

### Problem: Claude can't find files

**Solution:**
Make sure you configured the filesystem server (Step 4.5) and placed files in the allowed directory.

```bash
# Check files are in the right place
ls -la ~/mcp-data/

# Make sure filesystem server is in Claude config
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

## 📁 File Structure Verification

Your directory should look like:

```
mcp-code-execution/
├── build/                     ✅ Created after npm run build
│   ├── server.js
│   ├── executor/
│   └── types/
├── examples/
│   ├── sample-nginx.log       ✅ Sample log file
│   └── analyze-logs.py        ✅ Analyzer script
├── src/
│   ├── server.ts
│   ├── executor/
│   │   └── python-executor.ts
│   └── types/
│       └── index.ts
├── node_modules/              ✅ Created after npm install
├── package.json
├── tsconfig.json
├── README.md
├── CLAUDE.md
└── SETUP.md                   ← You are here!
```

## ✅ Success Checklist

- [ ] Node.js 18+ installed
- [ ] Python 3 installed
- [ ] Dependencies installed (`npm install`)
- [ ] Project built successfully (`npm run build`)
- [ ] Build directory exists with server.js
- [ ] MCP Inspector works (`npm run inspect`)
- [ ] Log analyzer script runs (`python3 examples/analyze-logs.py ...`)
- [ ] Filesystem server installed and built
- [ ] Data directory created (`~/mcp-data`)
- [ ] Claude config updated with BOTH servers
- [ ] Claude Desktop restarted
- [ ] `execute_code` tool appears in Claude
- [ ] `read_file` and `list_directory` tools appear in Claude
- [ ] Test execution successful

## 🚨 Common Misconception

**WRONG:** "MCP lets Claude access my files"  
**CORRECT:** "MCP filesystem server lets Claude SEE my files. Code execution server lets Python PROCESS them without uploading."

You need BOTH servers for the full workflow:
1. **Filesystem server** → Claude knows what files exist
2. **Code execution server** → Python can read and analyze them locally

**Example workflow:**
```
User: "Analyze my billing.csv"
→ Claude uses filesystem to find billing.csv
→ Claude writes Python script to analyze it
→ MCP executes Python (reads billing.csv locally)
→ Returns compact summary to Claude
→ Claude explains results to user
```

**Key insight:** billing.csv NEVER goes to Anthropic's servers.

## 🎓 Next Steps

1. **Try different use cases:**
   - Configuration validation
   - Data processing
   - System health checks

2. **Extend the server:**
   - Add Bash executor
   - Add file upload capability
   - Enhance security features

3. **Monitor token savings:**
   - Compare token usage with/without MCP
   - Document your savings

## 📚 Documentation

- **README.md** - Full documentation and examples
- **CLAUDE.md** - AI assistant usage guide
- **SETUP.md** - This file

## 🆘 Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. Review Claude Desktop logs
3. Test each component individually:
   - Does Python work? → `python3 --version`
   - Does Node work? → `node --version`
   - Does the build exist? → `ls build/server.js`
   - Does Python script work? → `python3 examples/analyze-logs.py examples/sample-nginx.log`
   - Does MCP Inspector work? → `npm run inspect`
   - Is filesystem server built? → `ls ~/path/to/servers/src/filesystem/dist/index.js`

## 🎉 You're Ready!

Once all checklist items are complete, you have a fully working MCP 2.0 code execution server that can:

✅ Execute Python code securely  
✅ Analyze logs with massive token savings  
✅ Process large files locally  
✅ Return compact summaries  
✅ Save 20-99% in token costs (depending on file size)  

**Start saving tokens today!** 🚀
