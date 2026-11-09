import Toybox.Activity;
import Toybox.ActivityMonitor;
import Toybox.Application;
import Toybox.Graphics;
import Toybox.Lang;
import Toybox.System;
import Toybox.Time;
import Toybox.Time.Gregorian;
import Toybox.WatchUi;

//! Custom-drawn watch face for the Garmin Instinct family.
//!
//! Everything is drawn by hand in onUpdate() with the Dc (device context),
//! no layout XML. Positions are fractions of the screen size so the same
//! code works on the 156 px Instinct 2S / E 40mm, the 176 px Instinct 2 / 2X /
//! 3 Solar and the 390-416 px Instinct 3 AMOLED.
//!
//! Layout on a 176 x 176 Instinct 2:
//!
//!   +-------------------------------+
//!   |  SUN 9 NOV             (42)   |  date, sub-screen (seconds / battery %)
//!   |                               |
//!   |            12:34              |  time, biggest number font that fits
//!   |                               |
//!   |     5234            72        |  steps (left), heart rate (right)
//!   |     STEPS           BPM       |
//!   |        o  [####   ]           |  phone connected dot, battery bar
//!   +-------------------------------+
class InstinctFaceView extends WatchUi.WatchFace {

    private var _isAwake as Boolean = true;
    private var _partialUpdatesAllowed as Boolean = false;
    private var _subscreen as Graphics.BoundingBox? = null;

    // User settings, see resources/settings/properties.xml
    private var _showSecondsInSleep as Boolean = false;
    private var _darkBackground as Boolean = true;

    private var _foreground as Graphics.ColorType = Graphics.COLOR_WHITE;
    private var _background as Graphics.ColorType = Graphics.COLOR_BLACK;

    function initialize() {
        WatchFace.initialize();
        // The round sub-screen exists on Instinct 2 / 2S / 2X / 3 Solar / E.
        // getSubscreen() returns null on models without one (Crossover, 3 AMOLED).
        if (WatchUi has :getSubscreen) {
            _subscreen = WatchUi.getSubscreen();
        }
        _partialUpdatesAllowed = (WatchUi.WatchFace has :onPartialUpdate);
        loadSettings();
    }

    //! Read user settings. Called at start and whenever settings change.
    function loadSettings() as Void {
        _showSecondsInSleep = readBoolean("ShowSecondsInSleep", false);
        _darkBackground = readBoolean("DarkBackground", true);
        _foreground = _darkBackground ? Graphics.COLOR_WHITE : Graphics.COLOR_BLACK;
        _background = _darkBackground ? Graphics.COLOR_BLACK : Graphics.COLOR_WHITE;
    }

    private function readBoolean(key as String, fallback as Boolean) as Boolean {
        var value = Application.Properties.getValue(key);
        if (value instanceof Lang.Boolean) {
            return value;
        }
        return fallback;
    }

    //! Called by the delegate when the system says seconds cost too much power.
    function turnPartialUpdatesOff() as Void {
        _partialUpdatesAllowed = false;
    }

    // ---- Lifecycle -------------------------------------------------------

    function onLayout(dc as Dc) as Void {
    }

    function onShow() as Void {
    }

    function onHide() as Void {
    }

    //! The watch was raised or a button pressed: updates come every second.
    function onExitSleep() as Void {
        _isAwake = true;
        WatchUi.requestUpdate();
    }

    //! The watch went back to low power: updates come once a minute.
    function onEnterSleep() as Void {
        _isAwake = false;
        WatchUi.requestUpdate();
    }

    // ---- Drawing ---------------------------------------------------------

    //! Full redraw. Once a minute while asleep, once a second while awake.
    function onUpdate(dc as Dc) as Void {
        dc.setColor(_foreground, _background);
        dc.clear();
        if (dc has :setAntiAlias) {
            dc.setAntiAlias(true);
        }

        var width = dc.getWidth();
        var height = dc.getHeight();

        drawDate(dc, width, height);
        drawTime(dc, width, height);
        drawStats(dc, width, height);
        drawBattery(dc, width, height);
        drawSubscreen(dc);
    }

    //! Once-a-second update while asleep. Only the sub-screen is redrawn,
    //! inside a clip region, so we stay within the power budget.
    function onPartialUpdate(dc as Dc) as Void {
        var box = _subscreen;
        if (box == null) {
            return;
        }
        if (!_partialUpdatesAllowed || !_showSecondsInSleep) {
            return;
        }
        dc.setClip(box.x, box.y, box.width, box.height);
        drawSubscreen(dc);
        dc.clearClip();
    }

    private function drawDate(dc as Dc, width as Number, height as Number) as Void {
        var today = Gregorian.info(Time.now(), Time.FORMAT_MEDIUM);
        var text = Lang.format("$1$ $2$ $3$", [today.day_of_week, today.day, today.month]).toUpper();

        // Centre the date in the space left of the sub-screen, or across the
        // whole width when the device has no sub-screen.
        var box = _subscreen;
        var centerX = (box != null) ? box.x / 2 : width / 2;
        var y = height * 0.18;

        dc.setColor(_foreground, Graphics.COLOR_TRANSPARENT);
        dc.drawText(centerX, y, Graphics.FONT_SMALL, text,
            Graphics.TEXT_JUSTIFY_CENTER | Graphics.TEXT_JUSTIFY_VCENTER);
    }

    private function drawTime(dc as Dc, width as Number, height as Number) as Void {
        var clock = System.getClockTime();
        var is24Hour = System.getDeviceSettings().is24Hour;
        var hour = clock.hour;
        if (!is24Hour) {
            hour = hour % 12;
            if (hour == 0) {
                hour = 12;
            }
        }
        var text = Lang.format("$1$:$2$", [
            hour.format(is24Hour ? "%02d" : "%d"),
            clock.min.format("%02d")
        ]);

        var font = pickLargestFont(dc, text, width - 16);
        dc.setColor(_foreground, Graphics.COLOR_TRANSPARENT);
        dc.drawText(width / 2, height * 0.52, font, text,
            Graphics.TEXT_JUSTIFY_CENTER | Graphics.TEXT_JUSTIFY_VCENTER);
    }

    //! Return the biggest number font whose rendering of text fits in maxWidth.
    private function pickLargestFont(dc as Dc, text as String, maxWidth as Number) as Graphics.FontDefinition {
        var fonts = [
            Graphics.FONT_NUMBER_THAI_HOT,
            Graphics.FONT_NUMBER_HOT,
            Graphics.FONT_NUMBER_MEDIUM,
            Graphics.FONT_NUMBER_MILD
        ] as Array<Graphics.FontDefinition>;
        for (var i = 0; i < fonts.size(); i++) {
            if (dc.getTextWidthInPixels(text, fonts[i]) <= maxWidth) {
                return fonts[i];
            }
        }
        return Graphics.FONT_NUMBER_MILD;
    }

    private function drawStats(dc as Dc, width as Number, height as Number) as Void {
        var valueY = height * 0.74;
        var labelY = height * 0.84;
        var leftX = width * 0.30;
        var rightX = width * 0.70;
        var centered = Graphics.TEXT_JUSTIFY_CENTER | Graphics.TEXT_JUSTIFY_VCENTER;

        dc.setColor(_foreground, Graphics.COLOR_TRANSPARENT);
        dc.drawText(leftX, valueY, Graphics.FONT_SMALL, formatSteps(), centered);
        dc.drawText(leftX, labelY, Graphics.FONT_XTINY, "STEPS", centered);
        dc.drawText(rightX, valueY, Graphics.FONT_SMALL, formatHeartRate(), centered);
        dc.drawText(rightX, labelY, Graphics.FONT_XTINY, "BPM", centered);
    }

    private function formatSteps() as String {
        var steps = ActivityMonitor.getInfo().steps;
        if (steps == null) {
            return "--";
        }
        return steps.toString();
    }

    private function formatHeartRate() as String {
        var heartRate as Number? = null;
        var activityInfo = Activity.getActivityInfo();
        if (activityInfo != null) {
            heartRate = activityInfo.currentHeartRate;
        }
        if (heartRate == null) {
            // No live reading: fall back to the newest stored sample.
            var sample = ActivityMonitor.getHeartRateHistory(1, true).next();
            if (sample != null && sample.heartRate != ActivityMonitor.INVALID_HR_SAMPLE) {
                heartRate = sample.heartRate;
            }
        }
        if (heartRate == null) {
            return "--";
        }
        return heartRate.toString();
    }

    private function drawBattery(dc as Dc, width as Number, height as Number) as Void {
        var battery = System.getSystemStats().battery; // 0.0 to 100.0
        var barWidth = 28;
        var barHeight = 10;
        var x = (width - barWidth) / 2;
        var y = (height * 0.93).toNumber() - barHeight / 2;

        dc.setColor(_foreground, Graphics.COLOR_TRANSPARENT);
        dc.setPenWidth(1);
        dc.drawRectangle(x, y, barWidth, barHeight);
        dc.fillRectangle(x + barWidth, y + 3, 2, barHeight - 6); // the little nub
        var fillWidth = ((barWidth - 4) * battery / 100).toNumber();
        if (fillWidth > 0) {
            dc.fillRectangle(x + 2, y + 2, fillWidth, barHeight - 4);
        }

        // Small dot to the left of the bar when the phone is connected.
        if (System.getDeviceSettings().phoneConnected) {
            dc.fillCircle(x - 8, y + barHeight / 2, 2);
        }
    }

    //! The Instinct's round sub-screen. Shows seconds while awake (or while
    //! asleep if the user enabled that) and the battery percentage otherwise,
    //! with a battery ring around the edge. Does nothing on devices without one.
    private function drawSubscreen(dc as Dc) as Void {
        var box = _subscreen;
        if (box == null) {
            return;
        }
        var centerX = box.x + box.width / 2;
        var centerY = box.y + box.height / 2;
        var shorterSide = (box.width < box.height) ? box.width : box.height;
        var radius = shorterSide / 2 - 2;
        var battery = System.getSystemStats().battery;

        // Blank the area first so one-second updates do not stack glyphs.
        dc.setColor(_background, _background);
        dc.fillRectangle(box.x, box.y, box.width, box.height);

        var showSeconds = _isAwake || (_showSecondsInSleep && _partialUpdatesAllowed);
        var text = showSeconds
            ? System.getClockTime().sec.format("%02d")
            : battery.toNumber().toString() + "%";
        var font = showSeconds ? Graphics.FONT_NUMBER_MILD : Graphics.FONT_SMALL;

        dc.setColor(_foreground, Graphics.COLOR_TRANSPARENT);
        dc.drawText(centerX, centerY, font, text,
            Graphics.TEXT_JUSTIFY_CENTER | Graphics.TEXT_JUSTIFY_VCENTER);

        // Battery ring: starts at 12 o'clock and sweeps clockwise.
        var sweep = (360 * battery / 100).toNumber();
        if (sweep > 0) {
            dc.setPenWidth(2);
            dc.drawArc(centerX, centerY, radius, Graphics.ARC_CLOCKWISE, 90, 90 - sweep);
        }
    }
}
