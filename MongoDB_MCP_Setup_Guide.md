# MongoDB MCP Server Setup Guide for Windsurf

## Overview
This guide will help you set up the MongoDB MCP (Model Context Protocol) server in Windsurf to connect to our MongoDB Atlas cluster. This enables AI-powered database operations directly within the Windsurf IDE.

## Prerequisites
- Windsurf IDE installed
- Access to our MongoDB Atlas cluster
- Node.js/npm (usually included with Windsurf)

## Step 1: Get MongoDB Atlas Credentials

### A. Database Connection String
Use this connection string (replace `<password>` with the actual password):
```
mongodb+srv://admin2:<password>@cluster0.lq2vwcf.mongodb.net/test?retryWrites=true&w=majority
```

**Current password**: `jdMh9jNB9fHBHJVT`

### B. Atlas API Credentials
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Navigate to **Organization** → **Access Manager** → **API Keys**
3. Click **Create API Key**
4. Set permissions:
   - ✅ Organization Member
   - ✅ Project Data Access Admin  
   - ✅ Project Owner (recommended)
5. Copy the **Public Key** and **Private Key** (save these securely!)

## Step 2: Create MCP Configuration File

Create the file: `%USERPROFILE%\.codeium\windsurf\mcp_config.json`

**Full path example**: `C:\Users\[YourUsername]\.codeium\windsurf\mcp_config.json`

### Option A: Create via File Explorer
1. Open File Explorer
2. Navigate to: `%USERPROFILE%\.codeium\windsurf\`
3. Create folder `windsurf` if it doesn't exist
4. Create new file: `mcp_config.json`

### Option B: Create via Command Prompt
```cmd
cd %USERPROFILE%\.codeium
mkdir windsurf
cd windsurf
echo. > mcp_config.json
```

## Step 3: Configure the MCP Server

Add this content to `mcp_config.json`:

```json
{
  "mcpServers": {
    "MongoDB": {
      "command": "npx",
      "args": ["-y", "mongodb-mcp-server"],
      "env": {
        "MDB_MCP_API_CLIENT_ID": "YOUR_ATLAS_PUBLIC_KEY",
        "MDB_MCP_API_CLIENT_SECRET": "YOUR_ATLAS_PRIVATE_KEY", 
        "MDB_MCP_CONNECTION_STRING": "mongodb+srv://admin2:jdMh9jNB9fHBHJVT@cluster0.lq2vwcf.mongodb.net/test?retryWrites=true&w=majority"
      }
    }
  }
}
```

**⚠️ Important**: Replace `YOUR_ATLAS_PUBLIC_KEY` and `YOUR_ATLAS_PRIVATE_KEY` with your actual Atlas API credentials from Step 1B.

## Step 4: Update Windsurf User Settings

1. Open Windsurf
2. Go to **File** → **Preferences** → **Settings** (or `Ctrl+,`)
3. Click **Open Settings (JSON)** in the top right
4. Add this to your settings.json:

```json
{
  "mcp.servers": {
    "path": "C:\\Users\\[YourUsername]\\.codeium\\windsurf\\mcp_config.json"
  }
}
```

**⚠️ Important**: Replace `[YourUsername]` with your actual Windows username.

## Step 5: Restart Windsurf

1. **Completely close Windsurf** (ensure it's not running in system tray)
2. **Restart Windsurf**
3. Look for "**1 Available MCP Server**" in the interface

## Step 6: Test the Connection

### Test 1: Check MCP Server Status
- In Windsurf chat, ask Cascade to "list MongoDB databases"
- You should see: `test`, `admin`, `local` databases

### Test 2: Verify Collections
- Ask to "show collections in the test database"  
- You should see: `accounts`, `products`, `users`, `warehouses`, `categories`

### Test 3: Atlas API (Optional)
- Ask to "list MongoDB Atlas projects"
- If this fails with auth error, Atlas API needs new credentials (Step 1B)

## Current Database Schema

Our test database contains these collections:
- **accounts** - User account information
- **products** - Product catalog
- **users** - User profiles  
- **warehouses** - Inventory locations
- **categories** - Product categorization

## Troubleshooting

### Issue: "No MCP Servers Available"
**Solutions:**
1. Check file path in settings.json matches actual mcp_config.json location
2. Verify JSON syntax is valid (use JSON validator)
3. Restart Windsurf completely

### Issue: "Cannot connect to database"
**Solutions:**
1. Verify connection string has correct password
2. Check network connectivity
3. Ensure IP is whitelisted in Atlas (if applicable)

### Issue: "Atlas API authentication failed"
**Solutions:**
1. Generate new API keys in Atlas
2. Verify API key permissions include required roles
3. Update mcp_config.json with new credentials
4. Restart Windsurf

### Issue: "MongoDB MCP server not found"
**Solutions:**
1. Ensure you have internet connection (npx downloads the server)
2. Try running `npx -y mongodb-mcp-server` manually in terminal
3. Check if corporate firewall blocks npm downloads

## Security Notes

- **Never commit** mcp_config.json to version control
- **Keep API keys secure** - they provide full access to our Atlas organization
- **Use environment variables** in production environments
- **Regularly rotate** API keys for security

## File Locations Summary

| File | Location |
|------|----------|
| MCP Config | `%USERPROFILE%\.codeium\windsurf\mcp_config.json` |
| Windsurf Settings | `%APPDATA%\Windsurf\User\settings.json` |

## Support

If you encounter issues:
1. Check this troubleshooting guide first
2. Verify all steps were followed exactly
3. Test with the validation steps
4. Contact team lead if problems persist

---

**Setup completed successfully when:**
✅ Windsurf shows "1 Available MCP Server"  
✅ Can list databases: test, admin, local  
✅ Can see collections in test database  
✅ AI can perform MongoDB operations through chat

**Last updated**: July 19, 2025
