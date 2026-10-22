# Trevor Higuera / Astrale

A lightweight game-style portfolio. Open through any static web server serving `dist/`. The portfolio opens directly on Showreel, with persistent navigation for Work, About, Credits, and Settings.

## Add your own interface sounds

1. Put short audio files in `dist/sounds/`.
2. Edit `dist/sound-config.js`, for example:

```js
window.ASTRALE_SOUNDS = {
  hover: 'sounds/hover.mp3',
  click: 'sounds/click.mp3',
  open: 'sounds/open.mp3'
};
```

3. Republish to make those sounds available to every visitor.

Interface sound defaults to on and begins only after interaction. The sound settings panel controls local files for the current tab only; it does not upload or save them. Empty configuration values use synthesized demo tones.

## Content

Project video IDs and categories are in `dist/app.js`. Text, contact, résumé and social links are in `dist/index.html`. Layout and colors are in `dist/style.css`.

Media links and project descriptions were taken from https://iamastrale.carrd.co/. This first version includes six selected project entries and the original showreel; the reference's full archive is not reproduced.

## Performance and accessibility

No application framework, WebGL, or animation dependencies. Subtle transform-based hover motion honors reduced-motion settings. The showreel and work videos all open in the same modal player. Closing it unloads the video. Images load lazily. Native dialogs support Escape and keyboard focus management. Third-party Google Fonts and YouTube media require network access.



## Holographic background
The animated wire surface is in dist/hologram.js. It rotates and deforms continuously, with eased pointer control over tilt and rotation. Canvas rendering is capped at 30fps, with reduced geometry on small screens and bounded resolution. It pauses in background tabs and renders a still image for reduced-motion preferences. Menu glows pulse slowly using CSS opacity.



## Interface sounds

Hover and click sounds are saved in `dist/sounds/` and configured in `sound-config.js`. The site has no background music or ambient loop. The Settings screen controls interface sound and interface volume.

## Display treatment

`dist/screen-effects.css` controls the fine scanlines, glass edge shading, reflected light, accent bloom, and subtle color fringes on display headings. `dist/screen-effects.js` generates a 96px grain tile once; irregular compositor-only tile jumps refresh the grain at 10 Hz (about 6 Hz on mobile), with no continuous noise generation. The UI has a slow 0.45–0.75px focus drift on desktop and a fixed 0.45px softening on mobile. Video dialogs remain sharp. The slow scan sweep uses only a transform and pauses while hidden. Reduced-motion preferences disable the sweep, grain motion, and blur, and forced-colors mode removes the display overlay. The overlay ignores all pointer input, and native video dialogs remain above it so playback stays clear.

## Direct entry

The portfolio opens directly on the showreel screen. The interface fades in over 650 ms, with animation disabled when the visitor prefers reduced motion. There is no launch button, startup sequence, startup audio, ambient loop, or open-space note playback.
Navigation now uses a standalone selection screen (#menu). Enter portfolio always opens that menu; section links open full-width content with a persistent Back button. Returning to the menu restores keyboard focus to the last selected section. Browser hash navigation also updates the screen.
The current layout again keeps navigation and content visible together: left/right on desktop, persistent top tabs on mobile. Tab changes use a 140 ms fade-out and 320 ms blur/translate fade-in. Transitions cancel on rapid selection and are skipped for reduced motion. Enter portfolio opens Showreel; the previous content Back button is removed.
The desktop menu and content frame now share a fixed viewport-relative height and are vertically centered. Content scrolls inside the frame, whose corner accents remain stationary. Tab entry adds a 48-tile CSS mosaic reveal lasting at most 650 ms, with opacity/transform animation only; switching again removes the old overlay immediately. Reduced motion skips the effect.
The 2026 showreel is delivered as a 1080p H.264/AAC fast-start MP4 in `dist/video/showreel.mp4` (about 76 MB), with a separate six-second 720p hover preview and matching poster image. The custom reel-player.js/css provide seek, volume, mute, fullscreen and an optional edge-color glow sampled from a 32x18 canvas at 8 Hz. Sampling stops while paused, hidden or closed; reduced motion starts with glow off. Work videos keep their existing embeds. For local video seeking run node preview-server.cjs; PORT can override the default 4174.
