# Instinct Custom – a Connect IQ watch face for Garmin Instinct

A hand-drawn watch face written in Monkey C. Instead of a layout XML, the
view paints everything itself in `onUpdate()`, so you can change any element
by editing one function in `source/InstinctFaceView.mc`.

```
+-------------------------------+
|  SUN 9 NOV             (42)   |  date, sub-screen (seconds / battery %)
|                               |
|            12:34              |  time, biggest number font that fits
|                               |
|     5234            72        |  steps (left), heart rate (right)
|     STEPS           BPM       |
|        o  [####   ]           |  phone-connected dot, battery bar
+-------------------------------+
```

## What it does

- Time in 12 h or 24 h, following the watch setting.
- Date, centred in the space left of the sub-screen.
- Steps and heart rate, with a fallback to the last stored heart-rate sample.
- Battery bar at the bottom and a dot when the phone is connected.
- Instinct sub-screen: seconds while the watch is awake, battery percentage
  while asleep, plus a battery ring around the edge. Optionally seconds while
  asleep too (uses `onPartialUpdate` with a clip region to stay in budget).
- Two user settings: dark/light background, seconds while asleep.

Supported models are listed in `manifest.xml`: Instinct 2 / 2S / 2X,
Instinct 3 Solar, Instinct E, Instinct Crossover, Instinct 3 AMOLED.

## Which Instinct do I have?

Only Instinct models from the second generation onwards run Connect IQ.
Check the name under **Settings > System > About** on the watch (or in the
Garmin Connect app under your devices):

| Name on the watch                              | Connect IQ | Device id to build for     |
|------------------------------------------------|------------|----------------------------|
| Instinct, Instinct Solar, Tactical, Esports (2018-2021) | **No**  | none, this project cannot be installed |
| Instinct 2, Instinct 2 Solar, Dual Power, dezl  | Yes        | `instinct2`                |
| Instinct 2S, Instinct 2S Solar                  | Yes        | `instinct2s`               |
| Instinct 2X Solar                               | Yes        | `instinct2x`               |
| Instinct Crossover                              | Yes        | `instinctcrossover`        |
| Instinct E 40mm / 45mm                          | Yes        | `instincte40mm` / `instincte45mm` |
| Instinct 3 Solar 45mm / 50mm                    | Yes        | `instinct3solar45mm` (covers both sizes) |
| Instinct 3 AMOLED 45mm / 50mm                   | Yes        | `instinct3amoled45mm` / `instinct3amoled50mm` |

The first-generation Instinct Solar has a 128 x 128 screen and no Connect IQ
support, so its only customisation is the built-in watch-face editor on the
watch (hold **MENU**, choose **Watch Face**, then **Customize**).

## Build it

1. Install the [Connect IQ SDK Manager](https://developer.garmin.com/connect-iq/sdk/)
   and download the latest SDK (7.x or newer) plus the Instinct devices.
2. Install Visual Studio Code and the **Monkey C** extension.
3. Open this folder (`garmin-instinct-watchface`) in VS Code.
4. Command palette (Ctrl/Cmd+Shift+P):
   - `Monkey C: Generate a Developer Key` (once).
   - `Monkey C: Edit Products` and make sure your Instinct model is ticked.
     The SDK only accepts device ids it knows, so if a product in
     `manifest.xml` is flagged, untick it here and the extension rewrites the
     manifest for you.
5. Press F5 and pick your device (for example `instinct2`) to run in the
   simulator. In the simulator use **Settings > Low Power Mode** to see what
   the face looks like asleep, and **Simulation > Activity Data** to feed
   steps and heart rate.
6. `Monkey C: Build for Device` writes `bin/InstinctCustom.prg`.

## Put it on the watch

1. Connect the Instinct over USB. It mounts as a drive.
2. Copy the `.prg` file into `GARMIN/APPS/` on that drive and eject.
3. On the watch hold **UP (MENU)**, choose **Watch Face**, scroll to
   *Instinct Custom* and select it.

Settings can be changed from the Connect IQ phone app once the face is
installed (sideloaded faces show up under "My Device > Watch Faces").

## Customising

All drawing lives in `source/InstinctFaceView.mc`:

| Want to change       | Edit                       |
|----------------------|----------------------------|
| Position of an item  | the `height * 0.xx` / `width * 0.xx` fractions in each `draw...` function |
| Fonts                | `Graphics.FONT_...` constants; number fonts are listed in `pickLargestFont` |
| What the sub-screen shows | `drawSubscreen()`     |
| Add a data field     | copy `formatSteps()` and add a `drawText` call in `drawStats()` |
| Colours              | `loadSettings()`; Instinct MIP screens only have black and white, AMOLED models take any `Graphics.COLOR_*` |

Notes:

- MIP Instinct models are 1-bit. Any grey maps to white or black, so stick to
  `COLOR_WHITE` / `COLOR_BLACK` for predictable results.
- Showing seconds while asleep costs battery. The system cancels it if the
  per-second draw averages over the budget; the delegate logs the numbers to
  the simulator console when that happens.
- Instinct 3 AMOLED has no sub-screen, so `getSubscreen()` returns null and the
  sub-screen code is skipped. For a store release on AMOLED you would also
  need a burn-in-safe low-power design (fewer lit pixels, shifting positions).
