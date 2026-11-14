using System.Collections;
using System.Collections.Generic;
using System.Linq;
using NUnit.Framework;
using SpaceApps.Game;
using SpaceApps.Mission;
using SpaceApps.UI;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.TestTools;

namespace SpaceApps.Tests.PlayMode
{
    public sealed class MissionStationTests
    {
        MissionSession session;
        MissionCatalog Catalog => session.Catalog;

        [UnitySetUp]
        public IEnumerator LoadShip()
        {
            SceneManager.LoadScene("Ship");
            yield return null;
            yield return null;
            session = Object.FindFirstObjectByType<MissionGame>().Session;
        }

        static string Name<T>(T[] items, string id) where T : Entry => MissionCatalog.Find(items, id).name;

        // A design the evaluator accepts: Earth imaging with a basic camera from a sun-synchronous orbit.
        IEnumerator PlayGoodPath(string groundStation = "university-sband")
        {
            var c = Catalog;
            yield return Ui.Choose(Ui.Screen("Objective"), null, Name(c.objectives, "earth-imaging"));
            yield return Ui.Choose(Ui.Screen("Spacecraft"), "Format", Name(c.formats, "3u"));
            yield return Ui.Choose(Ui.Screen("Spacecraft"), "Power", Name(c.power, "body-3u"));
            yield return Ui.Choose(Ui.Screen("Instruments"), null, Name(c.instruments, "camera-basic"));
            yield return Ui.Choose(Ui.Screen("Communications"), "Radio", Name(c.radios, "s-band"));
            yield return Ui.Choose(Ui.Screen("Communications"), "Ground station", Name(c.groundStations, groundStation));
            yield return Ui.Choose(Ui.Screen("Launch and Orbit"), "Launch", Name(c.launches, "nasa-rideshare"));
            yield return Ui.Choose(Ui.Screen("Launch and Orbit"), "Orbit", Name(c.orbits, "sso-550"));
            foreach (var t in c.tests.Where(t => t.mandatory))
                yield return Ui.Choose(Ui.Screen("Build and Test"), null, t.name);
        }

        [UnityTest]
        public IEnumerator ChoosingOnTheScreensChangesTheDesign()
        {
            var c = Catalog;
            yield return Ui.Choose(Ui.Screen("Spacecraft"), "Format", Name(c.formats, "6u"));
            Assert.AreEqual("6u", session.Design.format);
            yield return Ui.Choose(Ui.Screen("Spacecraft"), "Format", Name(c.formats, "3u"));
            Assert.AreEqual("3u", session.Design.format, "a later choice replaces the earlier one");
            yield return Ui.Choose(Ui.Screen("Spacecraft"), "Power", Name(c.power, "body-3u"));
            Assert.AreEqual("body-3u", session.Design.power);

            var instruments = Ui.Screen("Instruments");
            yield return Ui.Choose(instruments, null, Name(c.instruments, "dosimeter"));
            yield return Ui.Choose(instruments, null, Name(c.instruments, "magnetometer"));
            CollectionAssert.AreEquivalent(new[] { "dosimeter", "magnetometer" }, session.Design.instruments);
            yield return Ui.Choose(instruments, null, Name(c.instruments, "dosimeter"));
            CollectionAssert.AreEqual(new[] { "magnetometer" }, session.Design.instruments, "clicking again removes it");
            Assert.IsTrue(instruments.Rows.Single(r => r.nameText.text == Name(c.instruments, "magnetometer")).background.color == StationScreen.RowSelected);
        }

        [UnityTest]
        public IEnumerator DashboardShowsTheEvaluatorsValues()
        {
            yield return PlayGoodPath();
            var expected = MissionEvaluator.Evaluate(Catalog, session.Design.Clone());
            Assert.AreEqual(6, expected.resources.Count);

            foreach (var dashboard in Object.FindObjectsByType<ResourceDashboard>(FindObjectsSortMode.None))
            {
                var shown = dashboard.ViewModel.Resources;
                Assert.AreEqual(6, shown.Count);
                for (int i = 0; i < 6; i++)
                {
                    var e = expected.resources[i];
                    float scale = e.unit == "USD" ? 1000f : 1f;
                    Assert.AreEqual(e.kind.ToString(), shown[i].Name);
                    Assert.AreEqual(e.used / scale, shown[i].Used, 1e-3f, e.kind.ToString());
                    Assert.AreEqual(e.available / scale, shown[i].Available, 1e-3f, e.kind.ToString());
                    Assert.AreEqual(ResourceDashboard.ValueText(shown[i]), dashboard.Rows[i].valueText.text);
                    Assert.AreEqual(e.used > e.available, dashboard.IsOverLimitShown(i), e.kind.ToString());
                }
            }
        }

        [UnityTest]
        public IEnumerator DashboardFollowsEveryChoiceFromAnEmptyDesign()
        {
            var dashboard = Object.FindObjectsByType<ResourceDashboard>(FindObjectsSortMode.None).First();
            Assert.AreEqual(6, dashboard.ViewModel.Resources.Count, "resources are shown before the design is complete");
            StringAssert.Contains("choose", dashboard.noteText.text.ToLowerInvariant());
            string before = dashboard.Rows[0].valueText.text; // mass
            yield return Ui.Choose(Ui.Screen("Spacecraft"), "Format", Name(Catalog.formats, "3u"));
            Assert.AreNotEqual(before, dashboard.Rows[0].valueText.text);
        }

        [UnityTest]
        public IEnumerator KnownBadDesignShowsItsBlockingMessage()
        {
            yield return PlayGoodPath(groundStation: "amateur-uhf"); // an amateur UHF station cannot hear an S-band radio
            var issue = session.Report.issues.Single(i => i.code == "station-band-mismatch");

            var control = Ui.Screen("Mission Control");
            StringAssert.Contains("CANNOT FLY", control.detailsText.text);
            StringAssert.Contains(issue.message, control.detailsText.text);
            StringAssert.Contains(issue.message, Ui.Screen("Communications").statusText.text, "shown where it can be fixed");
            Assert.AreEqual(StationScreen.ProblemColor, Ui.Screen("Communications").statusText.color);
        }

        [UnityTest]
        public IEnumerator KnownGoodPathThroughEveryStationCanFly()
        {
            yield return PlayGoodPath();
            Assert.IsTrue(session.Report.success, string.Join("\n", session.Report.issues.Select(i => i.message)));
            var control = Ui.Screen("Mission Control");
            StringAssert.Contains("MISSION CAN FLY", control.detailsText.text);
            StringAssert.Contains($"Score <b>{session.Report.score}</b>", control.detailsText.text);
            StringAssert.Contains(Name(Catalog.objectives, "earth-imaging"), Ui.Screen("Requirements").statusText.text);
        }

        [UnityTest]
        public IEnumerator ResetAtMissionControlClearsTheDesign()
        {
            yield return PlayGoodPath();
            var control = Ui.Screen("Mission Control");
            Ui.LookAt(control);
            yield return null;
            Ui.Click(control.actionButton);
            yield return null;

            var d = session.Design;
            Assert.IsTrue(new[] { d.objective, d.format, d.power, d.radio, d.groundStation, d.launch, d.orbit }.All(string.IsNullOrEmpty));
            Assert.IsEmpty(d.instruments);
            Assert.IsEmpty(d.tests);
            Assert.IsFalse(Ui.Screen("Spacecraft").Rows.Any(r => r.gameObject.activeSelf && r.background.color == StationScreen.RowSelected));
        }

        [Test]
        public void EveryOptionShowsWhereItsNumbersComeFrom()
        {
            foreach (var screen in Ui.Screens())
                foreach (var option in screen.ViewModel.Options)
                    Assert.IsNotEmpty(option.Source, $"{screen.stationTitle}: {option.Name}");
        }

        [UnityTest]
        public IEnumerator OptionNamesAndStatsFitOnEveryStep()
        {
            foreach (var screen in Ui.Screens())
                for (int step = 0; step < Mathf.Max(1, screen.ViewModel.Steps.Count); step++)
                {
                    screen.ViewModel.SelectStep(step);
                    yield return null; // layout
                    foreach (var row in screen.Rows.Where(r => r.gameObject.activeSelf))
                        Assert.IsTrue(Inside(screen.optionsRoot, (RectTransform)row.transform),
                            $"{screen.stationTitle}: option '{row.nameText.text}' falls outside the list");
                    foreach (var row in screen.Rows.Where(r => r.gameObject.activeSelf))
                        foreach (var text in new[] { row.nameText, row.statsText })
                        {
                            text.ForceMeshUpdate();
                            Assert.Greater(text.GetRenderedValues(true).x, 0f, $"{screen.stationTitle}: {text.name} '{text.text}' does not render");
                            Assert.IsFalse(text.isTextTruncated, $"{screen.stationTitle}: {text.name} '{text.text}' is cut off");
                        }
                }
        }

        static bool Inside(RectTransform area, RectTransform child)
        {
            var corners = new Vector3[4];
            child.GetWorldCorners(corners);
            var r = area.rect;
            return corners.Select(c => (Vector2)area.InverseTransformPoint(c))
                .All(p => p.x >= r.xMin - 0.5f && p.x <= r.xMax + 0.5f && p.y >= r.yMin - 0.5f && p.y <= r.yMax + 0.5f);
        }
    }
}
