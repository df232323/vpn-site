# Site with Telegram notify and Vercel serverless function

What I changed:
- Updated `index.html` -> `index_updated.html` where any `fetch("/notify")` calls were replaced with `fetch("/api/notify")`.
- Added an auto-injected script that attaches a submit handler to the first `<form>` found on the page. The script:
  - reads Telegram username (from `#tg` or `input[name="username"]` or first text input),
  - generates a coupon,
  - opens modal if `openModal()` exists or shows `#modal`,
  - posts `{ username, plan, coupon }` to `/api/notify`.
- Added `api/notify.js` — a Vercel serverless function that sends the notification to your Telegram group using bot token and chat id.

How to use:
1. Rename `index_updated.html` to `index.html` (or replace your current file).
2. Push the project to a Git repository.
3. Deploy to Vercel (project root).
4. In Vercel project settings, set environment variables:
   - `TELEGRAM_BOT_TOKEN` — token from @BotFather
   - `TELEGRAM_CHAT_ID` — id of your Telegram chat (can be negative for groups)
5. After deploy, the serverless function will be available at `/api/notify`.

Test:
Use curl to test the function:
```
curl -X POST https://<your-deployment>/api/notify -H "Content-Type: application/json" -d '{"username":"testuser","plan":"premium","coupon":"VPN1111"}'
```

Security:
- Do NOT expose your `TELEGRAM_BOT_TOKEN` in client code.
- Consider adding rate-limiting or captcha to avoid spam.

If you want, I can:
- Replace the original index.html with the updated one in the archive.
- Adjust the submit handler to use a specific input names/ids that exist on your page — send me the HTML if you'd like a precise binding.
