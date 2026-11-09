import Toybox.Application;
import Toybox.Lang;
import Toybox.WatchUi;

//! Application entry point. Creates the watch face view and, on devices that
//! support it, the delegate that tells us when partial updates cost too much.
class InstinctFaceApp extends Application.AppBase {

    private var _view as InstinctFaceView? = null;

    function initialize() {
        AppBase.initialize();
    }

    function onStart(state as Dictionary?) as Void {
    }

    function onStop(state as Dictionary?) as Void {
    }

    function getInitialView() as [Views] or [Views, InputDelegates] {
        var view = new InstinctFaceView();
        _view = view;
        if (WatchUi has :WatchFaceDelegate) {
            return [view, new InstinctFaceDelegate(view)];
        }
        return [view];
    }

    //! Called when the user changes settings in Garmin Connect / Connect IQ app.
    function onSettingsChanged() as Void {
        var view = _view;
        if (view != null) {
            view.loadSettings();
        }
        WatchUi.requestUpdate();
    }
}

function getApp() as InstinctFaceApp {
    return Application.getApp() as InstinctFaceApp;
}
