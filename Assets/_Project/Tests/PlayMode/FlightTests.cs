using System.Collections;
using System.Linq;
using NUnit.Framework;
using SpaceApps.Game;
using SpaceApps.Mission;
using SpaceApps.Ship;
using SpaceApps.UI;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.TestTools;

namespace SpaceApps.Tests.PlayMode
{
    public sealed class FlightTests
    {
        MissionGame game;
        MissionSession Session => game.Session;
        MissionFlight Flight => game.Flight;
        StationScreen Control => Ui.Screen("Mission Control");

        [UnitySetUp]
        public IEnumerator LoadShip()
        {
            SceneManager.LoadScene("Ship");
            yield return null;
            yield return null;
            game = Object.FindFirstObjectByType<MissionGame>();
        }

        // The evaluator's own known-good design, built from catalog ids.
        void ChooseGoodDesign(string groundStation = "university-sband") => Session.Change(d =>
        {
            d.objective = "earth-imaging"; d.format = "3u"; d.power = "body-3u"; d.radio = "s-band";
            d.groundStation = groundStation; d.launch = "nasa-rideshare"; d.orbit = "sso-550";
            d.instruments.Clear(); d.instruments.Add("camera-basic");
            d.tests.Clear(); d.tests.AddRange(Session.Catalog.tests.Where(t => t.mandatory).Select(t => t.id));
        });

        static string Headline(MissionOutcome outcome) => outcome switch
        {
            MissionOutcome.FullSuccess => "MISSION ACCOMPLISHED",
            MissionOutcome.Partial => "PARTIAL SUCCESS",
            MissionOutcome.Lost => "MISSION LOST",
            _ => "NEVER LAUNCHED",
        };

        [UnityTest]
        public IEnumerator AFlyableDesignLaunchesAndPlaysToItsOutcome()
        {
            ChooseGoodDesign();
            yield return Ui.Action(Control, "Launch");
            Assert.AreEqual(FlightState.Playing, Flight.State);
            Assert.AreEqual(1, Flight.Shown);

            yield return Ui.Action(Control, "Next");
            Assert.AreEqual(2, Flight.Shown, "Next shows one more entry");
            Flight.Tick(MissionFlight.SecondsPerEntry + 0.01f);
            Assert.AreEqual(Mathf.Min(3, Flight.Run.timeline.Count), Flight.Shown, "playback advances on its own");

            if (Flight.State == FlightState.Playing) yield return Ui.Action(Control, "Skip to end");
            Assert.AreEqual(FlightState.Finished, Flight.State);
            Assert.AreEqual(Flight.Run.timeline.Count, Flight.Shown);

            var expected = MissionSimulator.Run(Session.Catalog, Session.Design.Clone(), Flight.Seed);
            Assert.AreEqual(expected.outcome, Flight.Run.outcome, "same design and seed give the same run");
            StringAssert.Contains(Headline(expected.outcome), Control.detailsText.text);
            StringAssert.Contains($"Score <b>{expected.score}</b>", Control.detailsText.text);
            Assert.IsTrue(Control.ViewModel.IsDone);
        }

        [UnityTest]
        public IEnumerator ABlockedDesignCannotLaunch()
        {
            ChooseGoodDesign(groundStation: "amateur-uhf");
            Ui.LookAt(Control);
            yield return null;
            CollectionAssert.DoesNotContain(Control.ViewModel.Actions, "Launch");
            Assert.IsFalse(Flight.Launch());
            Assert.AreEqual(FlightState.Review, Flight.State);
            StringAssert.Contains("CANNOT FLY", Control.detailsText.text);
        }

        [UnityTest]
        public IEnumerator FlyingAgainUsesANewSeedAndRestartsThePlayback()
        {
            ChooseGoodDesign();
            yield return Ui.Action(Control, "Launch");
            if (Flight.State == FlightState.Playing) yield return Ui.Action(Control, "Skip to end");
            int firstSeed = Flight.Seed;
            foreach (var b in Control.ActionButtons.Where(b => b.gameObject.activeSelf))
            {
                b.label.ForceMeshUpdate();
                Assert.GreaterOrEqual(b.label.fontSize, 28f, $"'{b.label.text}' shrank too far to read");
            }

            yield return Ui.Action(Control, "Fly again");
            Assert.AreNotEqual(firstSeed, Flight.Seed);
            Assert.AreEqual(1, Flight.Shown);
            Assert.AreEqual(Flight.Run.timeline.Count > 1 ? FlightState.Playing : FlightState.Finished, Flight.State);
        }

        [UnityTest]
        public IEnumerator ChangingTheDesignAfterAFlightReturnsToReview()
        {
            ChooseGoodDesign();
            yield return Ui.Action(Control, "Launch");
            Session.Change(d => d.orbit = "leo-500");
            Assert.AreEqual(FlightState.Review, Flight.State);
            Assert.IsFalse(Control.ViewModel.IsDone);
        }

        [Test]
        public void TheRisksOfTheMainEventsShowBeforeLaunch()
        {
            ChooseGoodDesign();
            StringAssert.Contains("Biggest risks", Control.detailsText.text);
            var top = Session.Catalog.events.OrderByDescending(e => MissionSimulator.EventChance(Session.Catalog, Session.Design, e.id)).First();
            StringAssert.Contains(top.name, Control.detailsText.text);
        }

        [Test]
        public void AnEmptyDesignShowsNoResourceOverTheLimit()
        {
            foreach (var dashboard in Object.FindObjectsByType<ResourceDashboard>(FindObjectsSortMode.None))
                for (int i = 0; i < dashboard.ViewModel.Resources.Count; i++)
                    Assert.IsFalse(dashboard.IsOverLimitShown(i), dashboard.Rows[i].valueText.text);
        }

        [UnityTest]
        public IEnumerator TheWelcomeSignShowsTheControlsOfTheActiveRig()
        {
            var sign = Object.FindFirstObjectByType<WelcomeSign>();
            var selector = Object.FindFirstObjectByType<RigSelector>();
            Assume.That(selector.XrActive, Is.False, "an XR device is active on this machine");
            Assert.AreEqual(MissionGame.DesktopControls, sign.controlsText.text);
            sign.controlsText.ForceMeshUpdate();
            Assert.IsFalse(sign.controlsText.isTextTruncated, "the controls fit on the sign");

            selector.Apply(true);
            yield return null;
            Assert.AreEqual(MissionGame.VrControls, sign.controlsText.text);
            selector.Apply(false);
            yield return null;
            Assert.AreEqual(MissionGame.DesktopControls, sign.controlsText.text);
        }

        [Test]
        public void StationsAreMarkedDoneOnlyWhenEveryChoiceIsMade()
        {
            var craft = Ui.Screen("Spacecraft");
            Assert.IsFalse(craft.doneBadge.activeSelf);
            Session.Change(d => d.format = "3u");
            Assert.IsFalse(craft.doneBadge.activeSelf, "power is still missing");
            Session.Change(d => d.power = "body-3u");
            Assert.IsTrue(craft.doneBadge.activeSelf);
            Assert.AreEqual(StationScreen.DoneColor, craft.numberText.color);
            Assert.AreEqual("3", craft.numberText.text);
            craft.numberText.ForceMeshUpdate();
            Assert.Greater(craft.numberText.GetRenderedValues(true).x, 0f, "the number is drawn");
        }
    }
}
