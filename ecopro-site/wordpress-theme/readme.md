# EcoPro USA WordPress Theme

This is a lightweight custom WordPress theme scaffold converted from the static `ecopro-site` homepage.

## What this is
- Native WordPress theme
- Keeps the current custom design
- Supports WordPress menus and logo
- Homepage content can be made editable through page custom fields / REST-backed meta
- Good base for moving to ACF later

## Folder to upload
Upload the entire `wordpress-theme` folder to:

`/wp-content/themes/ecopro-usa-custom/`

Then activate it in WordPress.

## Recommended setup
1. Zip this folder
2. In WordPress Admin -> Appearance -> Themes -> Add New -> Upload Theme
3. Activate the theme
4. Set a static homepage under Settings -> Reading
5. Assign your menu to the `Primary Menu` location
6. Optionally set a custom logo in Appearance -> Customize

## Important note about editability
Right now this is **WordPress-native**, but only the main hero/section text fields are wired for metadata in code.
The products, testimonials, badges, and pillars are still hardcoded in `front-page.php`.

So this is a **good deployable starting point**, not the final polished CMS version.

## Best next step
Install **Advanced Custom Fields (ACF)** and convert:
- pillars
- featured products
- case studies
- testimonials
- trusted-by logos

into repeater/flexible fields.

That will make it truly client-editable without touching code.

## Reality check
Yes, you can toss this into WordPress.
But if you want a clean business-ready handoff, I would do one more pass and ACF-ize the repeatable sections.
