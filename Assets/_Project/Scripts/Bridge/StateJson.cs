using System.Collections.Generic;
using SpaceApps.Mission;

namespace SpaceApps.Bridging
{
    /// <summary>Turns the mission's plain data into the JSON of docs/bridge.md, field for field.</summary>
    public static class StateJson
    {
        /// <summary>{ "type": ..., "payload": ... }, the form every message takes in both directions.</summary>
        public static string Envelope(string type, string payloadJson) =>
            new JsonWriter().BeginObject().Field("type", type).Key("payload").Raw(payloadJson ?? "{}").EndObject().ToString();

        public static string Message(MissionState state) => Envelope("state", Serialize(state));
        public static string Message(SimFrame frame) => Envelope("simTick", Serialize(frame));
        public static string OpenScreenMessage(string step) =>
            Envelope("openScreen", new JsonWriter().BeginObject().Field("step", step).EndObject().ToString());
        public static string CloseScreenMessage() => Envelope("closeScreen", "{}");

        public static string Serialize(MissionState s)
        {
            var w = new JsonWriter().BeginObject();
            w.Key("mission").BeginObject().Field("id", s.mission.id).Field("name", s.mission.name).Field("summary", s.mission.summary).EndObject();

            w.Key("steps").BeginArray();
            foreach (var st in s.steps) w.BeginObject().Field("step", st.step).Field("status", st.status).EndObject();
            w.EndArray();

            WriteDesign(w.Key("design"), s.design);

            w.Key("groups").BeginArray();
            foreach (var g in s.groups)
            {
                w.BeginObject().Field("group", g.group).Field("step", g.step).Field("multi", g.multi).Key("options").BeginArray();
                foreach (var o in g.options)
                {
                    w.BeginObject().Field("id", o.id).Field("name", o.name).Field("summary", o.summary).Key("stats").BeginArray();
                    foreach (var st in o.stats) w.BeginObject().Field("label", st.label).Field("value", st.value).Field("unit", st.unit).EndObject();
                    w.EndArray().Key("source").BeginObject().Field("status", o.source.status).Field("text", o.source.text).EndObject().EndObject();
                }
                w.EndArray().EndObject();
            }
            w.EndArray();

            w.Key("requirements").BeginArray();
            foreach (var r in s.requirements)
                w.BeginObject().Field("id", r.id).Field("label", r.label).Field("value", r.value).Field("unit", r.unit)
                 .Field("min", r.min).Field("max", r.max).Field("check", r.check).EndObject();
            w.EndArray();

            w.Key("resources").BeginArray();
            foreach (var r in s.resources)
                w.BeginObject().Field("kind", r.kind).Field("used", r.used).Field("available", r.available).Field("unit", r.unit).Field("known", r.known).EndObject();
            w.EndArray();

            w.Key("issues").BeginArray();
            foreach (var i in s.issues)
                w.BeginObject().Field("code", i.code).Field("severity", i.severity).Field("resource", i.resource).Field("step", i.step).Field("message", i.message).EndObject();
            w.EndArray();

            w.Key("attempts").BeginArray();
            foreach (var a in s.attempts)
                w.BeginObject().Field("number", a.number).Field("successRate", a.successRate).Field("imagesDelivered", a.imagesDelivered).Field("outcome", a.outcome).EndObject();
            w.EndArray();

            return w.EndObject().ToString();
        }

        // Each group is its id, or null when not chosen yet; the multi-select group is an array of ids.
        static void WriteDesign(JsonWriter w, EarthWatchDesign d)
        {
            w.BeginObject();
            foreach (var g in EarthWatchDesign.SingleGroups) w.Field(g, d.Get(g));
            w.Key(EarthWatchDesign.TestsGroup).BeginArray();
            foreach (var t in d.tests) w.Value(t);
            w.EndArray().EndObject();
        }

        public static string Serialize(SimFrame f)
        {
            var w = new JsonWriter().BeginObject()
                .Field("week", f.week).Field("day", f.day).Field("speed", f.speed)
                .Field("battery", f.battery).Field("pointingError", f.pointingError).Field("cameraTemp", f.cameraTemp)
                .Field("storageQueue", f.storageQueue).Field("linkQuality", f.linkQuality)
                .Field("imagesDelivered", f.imagesDelivered).Field("imagesLost", f.imagesLost).Field("projectedSuccess", f.projectedSuccess);

            w.Key("weeks").BeginArray();
            foreach (var x in f.weeks) w.Value(x ?? "");
            w.EndArray();

            w.Field("contact", f.contact).Field("capturing", f.capturing);

            w.Key("alert");
            if (f.alert == null) w.Null(); else w.BeginObject().Field("code", f.alert.code).Field("title", f.alert.title).EndObject();

            w.Key("commands").BeginArray();
            foreach (var c in f.commands) w.BeginObject().Field("name", c.name).Field("label", c.label).Field("enabled", c.enabled).Field("active", c.active).EndObject();
            w.EndArray();

            w.Key("log").BeginArray();
            foreach (var l in f.log) w.BeginObject().Field("week", l.week).Field("text", l.text).Field("kind", l.kind).EndObject();
            w.EndArray();

            w.Key("report");
            if (f.report == null) w.Null();
            else
            {
                var r = f.report;
                w.BeginObject().Field("successRate", r.successRate).Field("imagesDelivered", r.imagesDelivered);
                w.Key("factors").BeginArray();
                foreach (var x in r.factors) w.BeginObject().Field("label", x.label).Field("value", x.value).EndObject();
                w.EndArray().Field("lostBecause", r.lostBecause);
                w.Key("decisions").BeginArray();
                foreach (var x in r.decisions) w.Value(x);
                w.EndArray().Field("suggestion", r.suggestion);
                w.Key("images").BeginArray();
                foreach (var x in r.images) w.Value(x ?? "");
                w.EndArray();
                // Not in the contract: the page may show it as the verdict line. Fields may be added by either side.
                w.Field("outcome", r.outcome).EndObject();
            }
            return w.EndObject().ToString();
        }
    }
}
