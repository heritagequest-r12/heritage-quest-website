# Heritage Quest Website

Static website: HTML + CSS + vanilla JS. Supabase stores ratings and feedback. Hosted on GitHub Pages.

## Files
- `index.html`, `style.css`, `script.js` - the website
- `supabase-setup.sql` - run once in the Supabase SQL Editor
- `assets/images/` - put `hero-bg.jpg` (background) and `game-screenshot.png` here

## Things you edit (top of `script.js`, the CONFIG block)
- `SUPABASE_URL` and `SUPABASE_KEY` (public/publishable key ONLY)
- `DOWNLOAD_URL` (your GitHub Release link)
- `VERSION`, `PLATFORM`, `FILE_SIZE`

## Security
Never put the service_role / secret key in this project. Row Level Security lets visitors only read and add rows.
