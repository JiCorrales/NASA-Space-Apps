// Unity to page: hands one JSON message to window.MissionUI.receive(json), as docs/bridge.md says.
// Only the WebGL player loads this file; Bridge.cs has a no-op for every other platform.
mergeInto(LibraryManager.library, {
  MissionUI_Receive: function (jsonPtr) {
    var json = UTF8ToString(jsonPtr);
    if (typeof window !== 'undefined' && window.MissionUI && typeof window.MissionUI.receive === 'function') {
      window.MissionUI.receive(json);
    }
  }
});
