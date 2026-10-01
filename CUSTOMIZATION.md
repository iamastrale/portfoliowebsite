# Trevor Higuera / Astrale

A lightweight game-style portfolio. Open through any static web server serving `dist/`. The title screen leads to independent Showreel, Work, Profile, and Credits screens. Enter works from the title screen; the bottom menu and browser Back/Forward navigate the portfolio.

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

Visitors must turn sound on first. The sound settings panel previews local files for the current tab only; it does not upload or save them. Empty configuration values use synthesized demo tones.

## Content

Project video IDs and categories are in `dist/app.js`. Text, contact, résumé and social links are in `dist/index.html`. Layout and colors are in `dist/style.css`.

Media links and project descriptions were taken from https://iamastrale.carrd.co/. This first version includes six selected project entries and the original showreel; the reference's full archive is not reproduced.

## Performance and accessibility

No application framework, WebGL, or animation dependencies. Subtle transform-based hover motion honors reduced-motion settings. The main showreel loads when you enter its screen and is unloaded when you leave, stopping playback. Other videos load only when opened, and images load lazily. Native dialogs support Escape and keyboard focus management. Third-party Google Fonts and YouTube media require network access.



## Holographic background
The animated wire surface is in dist/hologram.js. It rotates and deforms continuously, with eased pointer control over tilt and rotation. Canvas rendering is capped at 30fps, with reduced geometry on small screens and bounded resolution. It pauses in background tabs and renders a still image for reduced-motion preferences. Menu glows pulse slowly using CSS opacity.



## Background atmosphere and default UI sounds

Your files are saved in `dist/sounds/`: `atmosphere.mp3`, `hover.mp3`, and `click.mp3`. Hover uses Hover.mp3; clicks and screen transitions use Click.mp3. Change paths in `sound-config.js` to replace them.

The atmosphere attempts playback on the main menu. Browsers that block autoplay show Enable sound; a user gesture starts it. Sound on/off is available on both the main menu and portfolio. Returning to the main menu does not stop it. Hidden tabs no longer suspend the atmosphere. Recovery handles unexpected source endings and tries to resume interrupted browser audio on focus or interaction. Browser/OS restrictions can still require a gesture.

Sound settings has independent atmosphere and interface volume controls. Project video dialogs fade the atmosphere out while open; use Sound off or the atmosphere slider when playing the inline showreel.

`ambience.js` blends the last four seconds into the beginning with an equal-power crossfade, normalizing only if needed to prevent clipping. The resulting 26.04-second buffer loops natively with explicit loop boundaries. A native OfflineAudioContext test rendered three full cycles of the supplied MP3 with identical, nonzero audio in every cycle. Mouse movement controls 0–100 cents of pitch with 350ms smoothing; speed changes slightly with pitch. Touch devices keep the base pitch.
