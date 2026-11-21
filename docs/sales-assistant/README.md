# Ask Mikee
Open **Ask Mikee** and type a question in English or Pidgin. Chat history stays in the open page. The server uses up to 16 recent messages per reply. The model handles tone and follow-ups. Prices and availability are shown in cards from the shop catalogue. Customers can open WhatsApp at any time.

## Preview setup
Use an isolated Supabase database with the shop schema and its catalogue. Apply supabase/migrations/20261121183000_sales_assistant.sql and verify the pg_cron retention job. Configure the existing server-only SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and SHOP_ORIGIN in Vercel Preview. The assistant reuses the existing catalogue function.

AI is off until spending approval. To enable it after approval, configure OPENAI_API_KEY and SALES_AI_APPROVED=true on the server. The fixed model is gpt-4.1-nano. Each chat completion has a 160-output-token ceiling and the database atomically caps the pilot at 100 attempted completions. Do not reset the counter automatically. Verify the account's remaining prepaid balance, exchange rate and charges before activation. If AI or the preview database is unavailable, the widget labels its catalogue-only fallback.

Negotiations, complaints and requests for a person offer a callback. Customers confirm sharing the conversation and provide a reply contact. Open **Admin → Sales assistant enquiries** to see the transcript and update the lead status. The database removes leads older than 30 days during the hourly retention run. For owner email alerts enable SALES_NOTIFY_ENABLED=true with the existing Resend sender and an approved budget. Owner alerts are capped at 20 per day. Without email, a successful save is acknowledged as an inbox request. If saving fails, WhatsApp remains available.

Run npm ci and npm run check for regression coverage. The mobile and desktop screenshots use simulated catalogue data. Hosted AI and email delivery require the corresponding configuration and were not activated during development.
