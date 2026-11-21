# Sales assistant preview
Open the storefront, select **Ask Mikee**, search a device, choose a catalogue variant, and enter buying preferences. WhatsApp works before qualification and opens a draft on the existing business number. The customer sends it. Saving to the admin inbox requires explicit consent. The owner can review the original device question, chosen answer and qualification details in **Admin → Sales assistant enquiries** and update the status.

## Preview configuration
Use an isolated Supabase preview database with existing store migrations, a catalogue, owner access and pg_cron available. Apply supabase/migrations/20261121183000_sales_assistant.sql there. Use the existing server-only SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and SHOP_ORIGIN in the preview environment. Check the hourly mikee-sales-retention job in cron.job and its run history. It removes 30-day-old leads at the next hourly run.

The default external AI spend is zero. After separate spending approval only, configure OPENAI_API_KEY and SALES_AI_APPROVED=true as server-only environment variables. A shopper must also opt in. Only the initial question is sent. The fixed model is gpt-4.1-nano, with a 180-character input, 32 output tokens and a shared lifetime allowance of 100 attempted requests per database. Never reset the counter as part of routine deployment. Before enabling, verify provider pricing, exchange rate, prepaid minimum and any hosting charges fit the remaining ₦10,000 budget. Keep the feature off if these costs are unknown. Search, qualification and WhatsApp work with AI off.

The server uses shop_deal_catalogue and the storefront price function for every quote and rechecks the variant and price at save. Unknown stock is shown as “Confirm availability”. Lead scores combine a selected device (25), budget covering its price (25), condition preference (10) and timeline (0–40). Hot starts at 75 and warm at 45. Human contact is available at every score. The inbox shows the newest 100 saved enquiries.

## Verification
Run npm ci and npm run check. Screenshots use fictional local test data. Hosted preview acceptance requires the preview migration and catalogue, a real owner session, and testing on a WhatsApp-enabled device. Optional paid inference requires approval. No payment settings are involved.
