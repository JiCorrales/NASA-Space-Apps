using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using NUnit.Framework;

namespace SpaceApps.Mission.Tests
{
    public class MissionCatalogTests
    {
        static readonly string[] Statuses = { "nasa-verified", "derived", "game-balance" };
        static readonly string[] NasaPrefixes = { "CubeSat 101", "NASA ", "CubeSat Design Specification" };

        static IEnumerable<(string path, Num num)> Numbers(object node, string path)
        {
            if (node == null) yield break;
            foreach (var f in node.GetType().GetFields(BindingFlags.Public | BindingFlags.Instance))
            {
                var value = f.GetValue(node);
                var p = $"{path}.{f.Name}";
                if (f.FieldType == typeof(Num)) yield return (p, (Num)value);
                else if (value is Entry[] || value is CatalogConstants)
                {
                    if (value is IList list)
                        for (int i = 0; i < list.Count; i++)
                            foreach (var n in Numbers(list[i], $"{p}[{((Entry)list[i]).id}]")) yield return n;
                    else
                        foreach (var n in Numbers(value, p)) yield return n;
                }
            }
        }

        [Test]
        public void EveryNumberHasASourceAndAStatus()
        {
            var numbers = Numbers(MissionCatalog.Load(), "catalog").ToList();
            Assert.Greater(numbers.Count, 100);
            foreach (var (path, num) in numbers)
            {
                Assert.IsNotNull(num, path);
                Assert.IsFalse(string.IsNullOrWhiteSpace(num.source), $"{path} has no source");
                CollectionAssert.Contains(Statuses, num.status, $"{path} has status '{num.status}'");
                StringAssert.DoesNotContain(".md", num.source, $"{path}: sources are for players, not repo paths");
                StringAssert.DoesNotContain("POR DEFINIR", num.source, path);
                Assert.LessOrEqual(num.source.Length, 160, $"{path}: source too long to read on screen");
                Assert.IsTrue(num.source.All(ch => ch < 128), $"{path}: source must be plain English text");
                if (num.status == "nasa-verified")
                    Assert.IsTrue(NasaPrefixes.Any(num.source.StartsWith), $"{path} is nasa-verified but does not cite a NASA document: {num.source}");
            }
        }

        [Test]
        public void EveryListIsFilledAndIdsAreUnique()
        {
            var c = MissionCatalog.Load();
            var lists = new Entry[][] { c.objectives, c.formats, c.instruments, c.power, c.radios, c.groundStations, c.launches, c.orbits, c.tests, c.licences };
            foreach (var list in lists)
            {
                Assert.IsNotEmpty(list);
                Assert.AreEqual(list.Length, list.Select(e => e.id).Distinct().Count());
                Assert.IsTrue(list.All(e => !string.IsNullOrEmpty(e.name)));
            }
        }

        [Test]
        public void CrossReferencesPointToRealEntries()
        {
            var c = MissionCatalog.Load();
            var orbits = new HashSet<string>(c.orbits.Select(o => o.id));
            var bands = new HashSet<string>(c.radios.Select(r => r.band));
            var tags = new HashSet<string>(c.instruments.SelectMany(i => i.tags));
            var dispensers = new HashSet<string>(c.formats.SelectMany(f => f.dispensers));
            foreach (var o in c.objectives)
            {
                CollectionAssert.IsSubsetOf(o.allowedOrbits, orbits, o.id);
                CollectionAssert.IsSubsetOf(o.preferredOrbits, orbits, o.id);
                CollectionAssert.IsSubsetOf(o.requiredTags, tags, o.id);
            }
            foreach (var l in c.launches)
            {
                CollectionAssert.IsSubsetOf(l.orbits, orbits, l.id);
                CollectionAssert.IsSubsetOf(l.dispensers, dispensers, l.id);
            }
            foreach (var g in c.groundStations) CollectionAssert.IsSubsetOf(g.bands, bands, g.id);
            foreach (var l in c.launches)
            {
                Assert.IsNotEmpty(l.vehicle, l.id);
                Assert.GreaterOrEqual(l.vehicleCapacityKg.value, l.maxMassKg.value, $"{l.id}: the rocket must lift at least what its dispenser holds");
            }
        }
    }
}
