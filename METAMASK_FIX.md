# 🔧 MetaMask Sonic Testnet Fix Guide

## Issue Detected

Contracts exist on Sonic Testnet RPC but MetaMask cannot access them. This is a common MetaMask configuration issue.

## 🚑 Quick Auto-Fix (Recommended)

1. Click the **🚑 AUTO-FIX MetaMask RPC Issue** button in the diagnostic panel
2. Approve all MetaMask prompts
3. Wait for the fix to complete
4. Check if diagnostic shows ✅ All contracts working

## 🔧 Manual Fix Steps

### Method 1: Reset Sonic Network

1. **Open MetaMask**
2. **Click Network dropdown** (top of MetaMask)
3. **Remove Sonic Testnet** if it exists:
   - Click Settings ⚙️
   - Networks
   - Find "Sonic Testnet"
   - Click "Delete"
4. **Add Fresh Sonic Testnet**:
   - Network Name: `Sonic Testnet`
   - RPC URL: `https://rpc.testnet.soniclabs.com`
   - Chain ID: `14601`
   - Currency Symbol: `S`
   - Block Explorer: `https://testnet.soniclabs.com`
5. **Switch to Sonic Testnet**
6. **Refresh browser page**

### Method 2: Clear MetaMask Cache

1. **Lock MetaMask** (click account → Lock)
2. **Unlock MetaMask** (enter password)
3. **Switch networks** (away and back to Sonic)
4. **Hard refresh page** (Ctrl+Shift+R)

### Method 3: Reset MetaMask Connection

1. **Disconnect site** in MetaMask:
   - MetaMask → Settings → Connected sites
   - Find localhost:3000
   - Click "Disconnect"
2. **Refresh page**
3. **Reconnect wallet**

## ✅ Verification

After any fix method:

1. Run diagnostic again
2. All contracts should show ✅ for both RPC and MetaMask
3. Frontend should work without errors

## 🆘 If Nothing Works

1. **Try different RPC**: `https://rpc-testnet.soniclabs.com`
2. **Use different browser** (fresh MetaMask state)
3. **Check Sonic Network status**: https://status.sonic.network
4. **Contact support** with diagnostic screenshot

## 🔍 Browser Console Commands

```javascript
// Run these in browser console (F12)
fixMetaMaskRPC(); // Auto-fix MetaMask RPC
refreshMetaMask(); // Force refresh MetaMask
diagnoseNetwork(); // Run full diagnostic
```
