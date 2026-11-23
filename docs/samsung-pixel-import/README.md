# Samsung search results and Pixel image import

Neostore page 1 contained 24 results. The merchant selected Samsung phones and earbuds. The six monitors and one microwave are outside that selection.

| Source listing | Mikee slug | Category | Change |
|---|---|---|---|
| [Samsung Galaxy A07](https://neostore.ng/shop/cmtjxfcpp003kkkkikedbx8mv) | samsung-a07 | Samsung phones | Existing model and image retained |
| [Samsung Galaxy A17](https://neostore.ng/shop/cmsvvmjco000fkkjbhofxl3mx) | samsung-a17 | Samsung phones | Existing model and image retained |
| [Samsung Galaxy A37 5G](https://neostore.ng/shop/cmsvtlurc000dkkjbciv40vxp) | samsung-a37 | Samsung phones | Existing model and image retained |
| [Samsung Galaxy A57 5G](https://neostore.ng/shop/cmsnsl57k00g9kkpvkw9fsfjk) | samsung-a57 | Samsung phones | Existing model and image retained |
| [Samsung Galaxy Z Fold8 Ultra](https://neostore.ng/shop/cmsku9oq300dlkkpvtijug71t) | samsung-z-fold-8-ultra | Samsung phones | Added the gallery image explicitly labelled Galaxy Z Fold8 Ultra |
| [Samsung Galaxy Buds FE](https://neostore.ng/shop/cmq1fmpp900097xhamnxd8qkp) | samsung-galaxy-buds-fe | Audio | New draft, price and condition pending |
| [Samsung Galaxy Buds 4 Pro](https://neostore.ng/shop/cmq1d56fs00017xjofbqym0n0) | samsung-galaxy-buds-4-pro | Audio | Added reference photo with model-labelled packaging |
| [Samsung Galaxy Buds 3 Pro](https://neostore.ng/shop/cmq1cfgia00077xn96k2lk530) | samsung-galaxy-buds-3-pro | Audio | Existing model and image retained |
| [Samsung Galaxy Buds 3](https://neostore.ng/shop/cmq1b4efx00057xn9068mqveb) | samsung-galaxy-buds-3 | Audio | Existing model and image retained |
| [Samsung Galaxy Buds 2 Pro](https://neostore.ng/shop/cmq10kffk00037x4kl9jqkpxw) | samsung-galaxy-buds-2-pro | Audio | Existing model and image retained |
| [Samsung Galaxy Z Trifold](https://neostore.ng/shop/cmpxx79fr000g7xjq3axf34f3) | samsung-z-trifold | Samsung phones | Existing model and image retained |
| [Samsung Galaxy Z Fold 7](https://neostore.ng/shop/cmp7fq4rj0001jm047pu1a4jk) | samsung-z-fold-7 | Samsung phones | Existing model and image retained |
| [Samsung Galaxy Z Fold 6](https://neostore.ng/shop/cmp7fd0bf0003ie04u30tqril) | samsung-z-fold-6 | Samsung phones | Existing model and image retained |
| [Samsung Galaxy Z Fold 5](https://neostore.ng/shop/cmp7f0ojt0001le045hor12vu) | samsung-z-fold-5 | Samsung phones | Existing model and image retained |
| [Samsung Galaxy Z Flip 4](https://neostore.ng/shop/cmp7enq7o0001ie04c6knukou) | samsung-z-flip-4 | Samsung phones | Existing model and image retained |
| [Samsung Galaxy S25 Ultra 5G](https://neostore.ng/shop/cmp7ed4s80001ky043gbu0pe7) | samsung-s25-ultra | Samsung phones | Existing model and image retained |
| [Samsung Galaxy S24 Ultra 5G](https://neostore.ng/shop/cmp7e23e60003jj04j1iy567q) | samsung-s24-ultra | Samsung phones | Existing model and image retained |

## Google Pixel

Revenes returned 32 condition-specific product records covering 20 Pixel phone models. Eleven existing listings received missing primary images. The 81 additional gallery views cover 18 models. Existing Mikee primary images are retained. Generic promotional slides and disputed model matches are excluded. For example, the source reused the same file across the Pixel 9 Pro and Pro XL listings.

Source and image URLs are recorded in commerce/licensed-image-sources.json and commerce/revenes-pixel-gallery.json. Merchant-confirmed Neostore and Revenes permission is documented in commerce/samsung-image-sources.json.

## Catalogue rollout

Deploy the image assets before running apply.sql in the intended database. The script fills the 39 audited empty SKU image records and inserts one disabled Galaxy Buds FE draft. The generated product pages also carry the supplemental Pixel galleries for existing covers. The update skips existing image overrides. Rollback restores matching fields and keeps the new product disabled.
