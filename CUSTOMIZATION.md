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

No application framework, WebGL, or animation dependencies. Subtle transform-based hover motion honors reduced-motion settings. The showreel and work videos all open in the same modal player. Closing it unloads the video. Images load lazily. Native dialogs support Escape and keyboard focus management. Third-party Google Fonts and YouTube media require network access.



## Holographic background
The animated wire surface is in dist/hologram.js. It rotates and deforms continuously, with eased pointer control over tilt and rotation. Canvas rendering is capped at 30fps, with reduced geometry on small screens and bounded resolution. It pauses in background tabs and renders a still image for reduced-motion preferences. Menu glows pulse slowly using CSS opacity.



## Background atmosphere and default UI sounds

Your files are saved in `dist/sounds/`: `atmosphere.mp3`, `hover.mp3`, and `click.mp3`. Hover uses Hover.mp3; clicks and screen transitions use Click.mp3. Change paths in `sound-config.js` to replace them.

The atmosphere attempts playback on the main menu. The toggle defaults to Sound on and reflects the selected preference. If a browser blocks autoplay, playback waits for the first interaction. Sound on/off is available on both the main menu and portfolio. Returning to the main menu resets sound to enabled. Hidden tabs no longer suspend the atmosphere. Recovery handles unexpected source endings and tries to resume interrupted browser audio on focus or interaction. Browser/OS restrictions can still require a gesture.

Sound settings has independent atmosphere and interface volume controls. Showreel and project video dialogs fade the atmosphere to exact zero over 450 ms and restore it over 700 ms on close (including Escape and clicking the backdrop). Repeated focus events do not restart fades. An explicit mute is still respected when closing a video.

`ambience.js` blends the last four seconds into the beginning with an equal-power crossfade, normalizing only if needed to prevent clipping. The resulting 26.04-second buffer loops natively with explicit loop boundaries. A native OfflineAudioContext test rendered three full cycles of the supplied MP3 with identical, nonzero audio in every cycle. Mouse movement controls 0–100 cents of pitch with 350ms smoothing; speed changes slightly with pitch. Touch devices keep the base pitch.

## Display treatment

`dist/screen-effects.css` controls the fine scanlines, glass edge shading, reflected light, accent bloom, and subtle color fringes on display headings. `dist/screen-effects.js` generates a 96px grain tile once; irregular compositor-only tile jumps refresh the grain at 10 Hz (about 6 Hz on mobile), with no continuous noise generation. The UI has a slow 0.45–0.75px focus drift on desktop and a fixed 0.45px softening on mobile. Video dialogs remain sharp. The slow scan sweep uses only a transform and pauses while hidden. Reduced-motion preferences disable the sweep, grain motion, and blur, and forced-colors mode removes the display overlay. The overlay ignores all pointer input, and native video dialogs remain above it so playback stays clear.

## Click-to-start boot sequence

The initial Begin experience button starts the emblem animation and Startup.mp3 together. Nothing advances until this button is activated (mouse, touch, or keyboard). This gesture also unlocks the atmosphere audio, kept silent until the menu reveal. The sequence lasts roughly 2.9 seconds, including a 700 ms sound fade. Escape skips after starting; reduced motion shows a static emblem. Returning to Main menu does not replay the intro.

The startup cue is configured in dist/sound-config.js and plays at 20% volume. The animation uses the shared moving grain, scanlines, glass shading, light sweep, focus drift, red-core bloom, and text fringing.
The revised startup MP3 uses a content-versioned URL to refresh browser caches. Atmosphere now fades in over 2.4 seconds starting with the visual menu reveal, overlapping the startup fade. Gain automation waits until the loop source is ready so slower decoding cannot consume the fade before playback. Video duck/restore timings remain 450/700 ms.
Startup gain now has an explicit current-time anchor and a smooth eased envelope, preventing reliance on older gain events and softening the initial rise out of silence.
Open-space clicks play a random note from dist/sounds/notes/note1.mp3 through note8.mp3, avoiding immediate repeats. Notes share the atmosphere gain and live 0–100 cent pitch automation (350 ms smoothing), with four simultaneous voices maximum. Muting or opening a video releases active notes. Controls, text, dialogs, and the startup sequence do not trigger notes. Each note adds a decaying wireframe ripple; reduced motion disables the ripple.
Note responsiveness update: notes trigger on pointer press rather than release, with no 110 ms cooldown. At four voices the oldest note fades out over 40 ms to make room, rather than dropping new presses. Noninteractive text and images also respond; actual controls and open dialogs remain excluded.
Navigation now uses a standalone selection screen (#menu). Enter portfolio always opens that menu; section links open full-width content with a persistent Back button. Returning to the menu restores keyboard focus to the last selected section. Browser hash navigation also updates the screen.
The current layout again keeps navigation and content visible together: left/right on desktop, persistent top tabs on mobile. Tab changes use a 140 ms fade-out and 320 ms blur/translate fade-in. Transitions cancel on rapid selection and are skipped for reduced motion. Enter portfolio opens Showreel; the previous content Back button is removed.
The desktop menu and content frame now share a fixed viewport-relative height and are vertically centered. Content scrolls inside the frame, whose corner accents remain stationary. Tab entry adds a 48-tile CSS mosaic reveal lasting at most 650 ms, with opacity/transform animation only; switching again removes the old overlay immediately. Reduced motion skips the effect.
The showreel uses the original H.264/AAC streams remuxed into dist/video/showreel.mp4 (fast-start MP4, about 92.6 MB). The custom reel-player.js/css provide seek, volume, mute, fullscreen and an optional edge-color glow sampled from a 32x18 canvas at 8 Hz. Sampling stops while paused, hidden or closed; reduced motion starts with glow off. Work videos keep their existing embeds. For local video seeking run node preview-server.cjs; PORT can override the default 4174.
