import Toybox.Lang;
import Toybox.System;
import Toybox.WatchUi;

//! Receives system callbacks for the watch face. The only one we care about
//! is the power budget: if drawing seconds every second takes too long, the
//! system stops calling onPartialUpdate and tells us here.
class InstinctFaceDelegate extends WatchUi.WatchFaceDelegate {

    private var _view as InstinctFaceView;

    function initialize(view as InstinctFaceView) {
        WatchFaceDelegate.initialize();
        _view = view;
    }

    function onPowerBudgetExceeded(powerInfo as WatchFacePowerInfo) as Void {
        System.println("Partial update too slow: " + powerInfo.executionTimeAverage
            + " ms average, limit " + powerInfo.executionTimeLimit + " ms");
        _view.turnPartialUpdatesOff();
    }
}
