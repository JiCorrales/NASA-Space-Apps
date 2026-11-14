using System.Globalization;
using System.Linq;
using SpaceApps.Mission;

namespace SpaceApps.Game
{
    /// <summary>Number formatting for the screens. Invariant culture so every machine shows the same text.</summary>
    static class Format
    {
        static readonly CultureInfo C = CultureInfo.InvariantCulture;

        public static string N(float v) => v.ToString("0.##", C);
        public static string Usd(float v) =>
            v >= 1e6f ? "$" + (v / 1e6f).ToString("0.##", C) + "M" :
            v >= 1e3f ? "$" + (v / 1e3f).ToString("0.#", C) + "k" : "$" + v.ToString("0", C);
        public static string Pct(float fraction) => (fraction * 100f).ToString("0", C) + "%";

        /// <summary>One line naming where the numbers come from, preferring NASA-verified values.</summary>
        public static string Source(params Num[] nums)
        {
            var shown = nums.Where(n => n != null && !string.IsNullOrEmpty(n.source)).ToList();
            if (shown.Count == 0) return "";
            var best = shown.FirstOrDefault(n => n.status == "nasa-verified")
                       ?? shown.FirstOrDefault(n => n.status == "derived") ?? shown[0];
            int nasa = shown.Count(n => n.status == "nasa-verified");
            return best.status == "nasa-verified"
                ? $"<color=#7fd4ff>NASA data</color> ({nasa} of {shown.Count} values): {best.source}"
                : best.source;
        }
    }
}
