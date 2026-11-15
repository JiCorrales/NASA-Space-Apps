using System.Globalization;
using System.Text;

namespace SpaceApps.Bridging
{
    /// <summary>A small JSON writer. JsonUtility cannot write null, mixed arrays or free-shaped objects,
    /// and the contract needs all three.</summary>
    public sealed class JsonWriter
    {
        readonly StringBuilder sb = new StringBuilder();
        bool comma;

        public override string ToString() => sb.ToString();

        void Before() { if (comma) sb.Append(','); }

        public JsonWriter BeginObject() { Before(); sb.Append('{'); comma = false; return this; }
        public JsonWriter EndObject() { sb.Append('}'); comma = true; return this; }
        public JsonWriter BeginArray() { Before(); sb.Append('['); comma = false; return this; }
        public JsonWriter EndArray() { sb.Append(']'); comma = true; return this; }

        public JsonWriter Key(string name) { Before(); Quote(name); sb.Append(':'); comma = false; return this; }

        public JsonWriter Value(string v) { Before(); if (v == null) sb.Append("null"); else Quote(v); comma = true; return this; }
        public JsonWriter Value(bool v) { Before(); sb.Append(v ? "true" : "false"); comma = true; return this; }
        public JsonWriter Value(int v) { Before(); sb.Append(v.ToString(CultureInfo.InvariantCulture)); comma = true; return this; }

        public JsonWriter Value(float v)
        {
            Before();
            // JSON has no NaN or Infinity; a broken number must not break the whole message.
            sb.Append(float.IsNaN(v) || float.IsInfinity(v) ? "0" : v.ToString("0.####", CultureInfo.InvariantCulture));
            comma = true; return this;
        }

        public JsonWriter Null() { Before(); sb.Append("null"); comma = true; return this; }

        /// <summary>Inserts text that is already valid JSON (a nested payload).</summary>
        public JsonWriter Raw(string json) { Before(); sb.Append(json); comma = true; return this; }

        public JsonWriter Field(string name, string v) => Key(name).Value(v);
        public JsonWriter Field(string name, float v) => Key(name).Value(v);
        public JsonWriter Field(string name, int v) => Key(name).Value(v);
        public JsonWriter Field(string name, bool v) => Key(name).Value(v);

        void Quote(string s)
        {
            sb.Append('"');
            foreach (var ch in s)
            {
                switch (ch)
                {
                    case '"': sb.Append("\\\""); break;
                    case '\\': sb.Append("\\\\"); break;
                    case '\n': sb.Append("\\n"); break;
                    case '\r': sb.Append("\\r"); break;
                    case '\t': sb.Append("\\t"); break;
                    default:
                        if (ch < ' ') sb.Append("\\u").Append(((int)ch).ToString("x4"));
                        else sb.Append(ch);
                        break;
                }
            }
            sb.Append('"');
        }
    }
}
