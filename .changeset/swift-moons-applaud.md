---
"agents": patch
---

Add automatic context wrapping for custom Agent methods

- **Automatic context wrapping**: Custom Agent methods are now automatically wrapped with proper context
- **Simplified API**: `getCurrentAgent()` is now the only public context API
- **Fixed `getCurrentAgent()` returning undefined**: Context is now properly maintained across all Agent method calls
