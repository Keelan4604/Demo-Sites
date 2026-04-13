# EcoPro WordPress Page Template

This package is for adding the new EcoPro homepage as a **single custom page template** inside the existing WordPress site.

## Files
- `ecopro-home-template.php` -> page template file
- `ecopro-custom/style.css` -> styles for the page
- `ecopro-custom/script.js` -> page behavior
- `ecopro-custom/images/eco-pro-logo-300x73.png` -> logo asset

## How to install
Because this is a **page template**, it must live inside the active theme.

### Option A - easiest if you have file access
Copy:
- `ecopro-home-template.php`
- the whole `ecopro-custom` folder

into your active WordPress theme folder:

`/wp-content/themes/YOUR-ACTIVE-THEME/`

So you end up with:

`/wp-content/themes/YOUR-ACTIVE-THEME/ecopro-home-template.php`
`/wp-content/themes/YOUR-ACTIVE-THEME/ecopro-custom/style.css`
`/wp-content/themes/YOUR-ACTIVE-THEME/ecopro-custom/script.js`
`/wp-content/themes/YOUR-ACTIVE-THEME/ecopro-custom/images/eco-pro-logo-300x73.png`

### Option B
If you only have wp-admin and no file manager / hosting access, this won't install cleanly by itself. A page template needs theme-file access.

## How to use in WordPress
1. Upload the files into the active theme
2. In WordPress admin, edit the Home page (or create a new page)
3. In the page settings / template dropdown, choose:
   `EcoPro Custom Homepage`
4. Publish/update the page
5. Set that page as the homepage under Settings -> Reading if needed

## Important
- This keeps your existing theme and Beaver Builder product setup intact
- This is safer than replacing the whole theme
- The content in this template is still hardcoded for now
- If you want it editable later, next step is wiring fields with ACF
