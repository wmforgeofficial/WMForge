# WMForge AI Tutor — starter integration

This package contains your updated website HTML/CSS/JS plus a floating AI Tutor UI and a secure-backend starter. It is designed to be added without changing existing site sections or existing `script.js` behavior.

## What is included
- `index.html`, `styles.css`, `script.js`: copies of the supplied site files with only the AI widget markup/style integration added.
- `ai-tutor.js`: floating chat behavior, open/close, new chat, starter prompts, message UI, error states.
- `worker.js`: Cloudflare Worker backend starter using an OpenAI-compatible chat-completions API.

## Important status
The floating widget UI works, but **live AI answers are intentionally not enabled yet**. `ENDPOINT` in `ai-tutor.js` is blank; therefore questions are not sent to any service. Do not publish expecting AI responses until the backend is deployed and configured.

## Add to your GitHub Pages repository
1. Back up your current site files.
2. Replace `index.html`, `styles.css`, and `script.js` with the package versions (or carefully merge the changes if your live site has newer edits).
3. Add `ai-tutor.js` to the same directory as `index.html`.
4. Keep all existing image/resource assets in their existing paths.
5. Test on a branch or staging copy before publishing.

## Backend setup (next milestone)
1. Create a Cloudflare Worker and paste in `worker.js`.
2. Set Worker variable `AI_API_URL` to your selected provider's OpenAI-compatible chat-completions endpoint.
3. Set `AI_MODEL` to a model available to your account.
4. Add secret `AI_API_KEY` using the provider's API key. Never add this key to website files or GitHub.
5. Set `ALLOWED_ORIGIN` to the exact site origin, e.g. `https://wmforge.in` (add `https://www.wmforge.in` too only if your site uses it).
6. Deploy the Worker and confirm `POST /api/chat` works only from your site origin. This starter includes request validation and origin checks; before public launch, add rate limiting/abuse controls and monitor quotas.
7. In `ai-tutor.js`, set `const ENDPOINT = 'https://YOUR-WORKER.workers.dev/api/chat';` to your deployed endpoint.
8. Test common SAP WM questions, wrong inputs, provider errors, mobile layout, and browser console. Publish only after tests pass.

## Cost and security notes
- This code does not guarantee a permanently free AI provider. Verify the selected provider's current free tier, quotas, terms, and regional eligibility before enabling it.
- CORS origin checks are not authentication and do not stop all automated abuse. Add rate limiting and quota alerts before making the endpoint public.
- Do not send company confidential data, credentials, personal data, or production screenshots with sensitive information to the tutor.
- AI answers can be incorrect. Verify system-specific steps against your SAP release/configuration and test changes outside production.


FRONTEND CONNECTION UPDATE (2026-10-27)
======================================
The ai-tutor.js file in this package is configured to use the deployed endpoint:
https://wmforge-ai-tutor.wmforgeofficial.workers.dev/api/chat

GitHub Pages deployment (safe, minimal-change approach):
1. Download/extract the frontend ZIP.
2. In your existing GitHub repository, replace index.html, styles.css, and script.js with the matching files from this package, and add ai-tutor.js at the repository root.
3. Do not upload worker.js to the public website repository. The backend runs on Cloudflare. Never publish GEMINI_API_KEY.
4. Commit the changes. Wait for GitHub Pages to publish, then open https://wmforge.in/ and hard-refresh (Ctrl+F5).
5. Test the floating “Ask WMForge AI” button, send a basic SAP WM question, and check a follow-up question.

Rollback: if anything looks wrong, use GitHub's file history to restore the previous index.html and styles.css (script.js is preserved from the supplied website files).
