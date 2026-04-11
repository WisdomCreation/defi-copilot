# 🐛 Critical Issues Found

## 1. **Limit Order Executes Immediately**

### Root Cause:
When you create a limit order like "buy SOL when it hits $95":
- Order is created with status "watching" ✅
- Backend order executor checks ALL "watching" orders immediately ❌
- If current SOL price already meets condition ($95 or below), it executes instantly ❌

### The Real Problem:
**Pre-signed transactions are fundamentally broken for limit orders!**

- Jupiter quotes expire in seconds/minutes
- Pre-signed tx includes stale quote data
- By the time price hits $95, the quote is invalid
- Transaction will FAIL when executed later

### Proper Solution (requires major refactor):
1. Don't pre-sign transactions
2. Store order parameters only
3. When triggered → build FRESH Jupiter quote
4. Then execute with current market data

### Quick Fix (temporary):
Add grace period - don't check orders created within last 60 seconds

---

## 2. **Order Dashboard Shows Zeros**

### Issue:
API returns correct data but frontend displays "0" for all fields

### Cause:
Need to verify field mapping between backend response and frontend display

---

## 3. **Chat History Not Showing**

### Issue:
- Messages are saved to localStorage ✅
- But "Recents" sidebar shows "No recent chats" ❌

### Cause:
- Need to save conversation metadata (title, timestamp)
- Currently only saving raw messages

---

## 4. **"New Chat" Button Behavior**

### Issue:
- Button asks "Are you sure you want to clear history?"
- User wants to SAVE current chat and start fresh, not delete

### Fix:
- Changed to just start new conversation
- Previous chats auto-saved
- No more scary confirmation dialog

