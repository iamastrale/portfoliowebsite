# Trevor Higuera / Astrale

A static, game-style sound design portfolio with a white/red palette, animated mouse-reactive hologram, showreel, project archive, credits, and custom audio. No install or build step is required.

## Upload to GitHub

1. Extract the ZIP on your computer.
2. Create a repository on GitHub with a `main` branch (select Add a README when creating it). Use a public repository for GitHub Pages on GitHub Free.
3. Choose **Add file → Upload files**. Upload the extracted contents, including `dist`, `.github`, `.gitignore`, and this README, to the repository root. Upload the contents, not the ZIP or an extra enclosing folder. Replace the initial README with this one.
4. Commit the files to `main`.

The repository should look like this:

```text
.github/workflows/pages.yml
.gitignore
README.md
CUSTOMIZATION.md
dist/
  index.html
  style.css
  app.js
  ambience.js
  hologram.js
  sound-config.js
  sounds/
    atmosphere.mp3
    hover.mp3
    click.mp3
```

## Put the website online with GitHub Pages

1. Open the repository's **Settings → Pages**.
2. Under **Build and deployment → Source**, select **GitHub Actions**.
3. Open **Actions → Deploy portfolio to GitHub Pages → Run workflow** and run it on `main`. If a first run failed before Pages was enabled, run it again now.
4. After it succeeds, open the website URL shown by the deployment or in Settings → Pages.

Later pushes to `main` redeploy automatically. If you use a different branch name, update `branches: [main]` in `.github/workflows/pages.yml`. All site assets use relative paths, so the website works under a repository subdirectory as well as a custom domain.

This export has not been uploaded or deployed to your GitHub account yet.

Official guide: [Using custom workflows with GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Preview locally

Serve `dist` with any static web server. For example, if Python is installed:

```sh
python -m http.server 8000 --directory dist
```

Then open http://localhost:8000. Use a web server rather than double-clicking `index.html`; background audio uses fetch and decoding that require an HTTP origin.

## Customize

- `dist/index.html`: text, résumé, contact, and social links.
- `dist/app.js`: project titles, categories, and YouTube IDs.
- `dist/style.css`: colors, typography, layout, and menu motion.
- `dist/hologram.js`: interactive wireframe animation.
- `dist/ambience.js`: ambient loop and mouse pitch behavior.
- `dist/sound-config.js`: default hover/click sound paths.

All three provided audio files are included. Google Fonts, YouTube embeds, and YouTube thumbnails require an internet connection. Sound defaults to on; browsers that block autoplay wait for the first interaction before starting audio. Sound settings previews are local to the current tab; to change the website's defaults, edit the files and commit them.

See [CUSTOMIZATION.md](CUSTOMIZATION.md) for implementation and audio details.
