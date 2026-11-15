using System;
using System.Collections.Generic;

namespace SpaceApps.Mission
{
    // Plain data the page draws. These mirror MissionState in docs/bridge.md; the Bridge assembly turns them into JSON.

    [Serializable] public class StepState { public string step, status; }
    [Serializable] public class StatInfo { public string label, unit; public float value; [NonSerialized] public Num origin; }
    /// <summary>Status is nasa, derived or team.</summary>
    [Serializable] public class SourceInfo { public string status, text; }

    [Serializable]
    public class OptionInfo
    {
        public string id, name, summary;
        public List<StatInfo> stats = new List<StatInfo>();
        public SourceInfo source;
    }

    [Serializable]
    public class GroupInfo
    {
        public string group, step;
        public bool multi;
        public List<OptionInfo> options = new List<OptionInfo>();
    }

    [Serializable]
    public class RequirementInfo
    {
        public string id, label, unit, check;
        public float value, min, max;
    }

    /// <summary>Kind is mass, power, budget, data, communications or time. Known is false until the choice that
    /// sets the limit has been made.</summary>
    [Serializable]
    public class ResourceInfo
    {
        public string kind, unit;
        public float used, available;
        public bool known;
    }

    /// <summary>Severity is warning or blocking.</summary>
    [Serializable]
    public class IssueInfo
    {
        public string code, severity, resource, step, message;
    }

    [Serializable] public class RequirementValue { public string id; public float value; }

    /// <summary>One run of the year. The first four fields go to the page; the rest is the record of what was chosen.</summary>
    [Serializable]
    public class AttemptInfo
    {
        public int number;
        public float successRate;
        public int imagesDelivered;
        public string outcome;
        public int seed;
        public EarthWatchDesign design;
        public List<RequirementValue> requirements = new List<RequirementValue>();
        public List<string> issueCodes = new List<string>();
    }

    [Serializable]
    public class MissionState
    {
        public MissionInfo mission;
        public List<StepState> steps = new List<StepState>();
        public EarthWatchDesign design;
        public List<GroupInfo> groups = new List<GroupInfo>();
        public List<RequirementInfo> requirements = new List<RequirementInfo>();
        public List<ResourceInfo> resources = new List<ResourceInfo>();
        public List<IssueInfo> issues = new List<IssueInfo>();
        public List<AttemptInfo> attempts = new List<AttemptInfo>();
    }
}
