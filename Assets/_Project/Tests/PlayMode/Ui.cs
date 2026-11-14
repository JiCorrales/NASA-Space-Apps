using System.Collections;
using System.Collections.Generic;
using System.Linq;
using NUnit.Framework;
using SpaceApps.UI;
using UnityEngine;
using UnityEngine.EventSystems;

namespace SpaceApps.Tests.PlayMode
{
    /// <summary>Drives the station screens the way a player does: aim the camera, raycast through the EventSystem, click.</summary>
    static class Ui
    {
        public static StationScreen[] Screens() =>
            Object.FindObjectsByType<StationScreen>(FindObjectsSortMode.None).OrderBy(s => s.transform.position.z).ToArray();

        public static StationScreen Screen(string title) => Screens().Single(s => s.stationTitle == title);

        /// <summary>Stand 1.6 m in front of the screen, looking at it.</summary>
        public static void LookAt(Component screen)
        {
            var cam = Camera.main;
            var t = screen.transform;
            cam.transform.SetPositionAndRotation(t.position - t.forward * 1.6f, Quaternion.LookRotation(t.forward));
        }

        /// <summary>Raycasts the screen point of the target through the EventSystem, then clicks what it hit.</summary>
        public static void Click(Component target)
        {
            var rt = (RectTransform)target.transform;
            var screenPoint = (Vector2)Camera.main.WorldToScreenPoint(rt.TransformPoint(rt.rect.center));
            var data = new PointerEventData(EventSystem.current) { position = screenPoint, button = PointerEventData.InputButton.Left };
            var hits = new List<RaycastResult>();
            EventSystem.current.RaycastAll(data, hits);
            Assert.IsNotEmpty(hits, $"nothing under {rt.name} at {screenPoint}");
            Assert.IsTrue(hits[0].gameObject.transform.IsChildOf(rt), $"{hits[0].gameObject.name} is in front of {rt.name}");
            data.pointerCurrentRaycast = hits[0];
            ExecuteEvents.ExecuteHierarchy(hits[0].gameObject, data, ExecuteEvents.pointerClickHandler);
        }

        /// <summary>On a station: open the step (if it has tabs) and click the option with this name.</summary>
        public static IEnumerator Choose(StationScreen screen, string step, string optionName)
        {
            LookAt(screen);
            yield return null;
            if (step != null)
            {
                Click(screen.Tabs.Single(t => t.gameObject.activeSelf && t.label.text == step).button);
                yield return null; // let the layout place the new rows
            }
            Click(screen.Rows.Single(r => r.gameObject.activeSelf && r.nameText.text == optionName).button);
            yield return null;
        }

        /// <summary>On a station: click the action button with this label.</summary>
        public static IEnumerator Action(StationScreen screen, string label)
        {
            LookAt(screen);
            yield return null; // layout of a freshly shown button row
            var button = screen.ActionButtons.SingleOrDefault(b => b.gameObject.activeSelf && b.label.text == label);
            Assert.IsNotNull(button, $"no '{label}' button at {screen.stationTitle}; shown: " +
                string.Join(", ", screen.ActionButtons.Where(b => b.gameObject.activeSelf).Select(b => b.label.text)));
            Click(button.button);
            yield return null;
        }
    }
}
