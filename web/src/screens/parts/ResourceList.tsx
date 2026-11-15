import type { Resource, ResourceKind } from "../../bridge/types";
import { ResourceBar, SourceTag } from "../../ui";

/** Resources as Unity reports them, with their source tag. `only` limits the list to the kinds a step changes. */
export function ResourceList({ resources, only }: { resources: Resource[]; only?: ResourceKind[] }) {
  const shown = only ? resources.filter((r) => only.includes(r.kind)) : resources;
  return (
    <ul className="res-list" aria-label="Resources">
      {shown.map((r) => (
        <li key={r.kind}>
          <ResourceBar resource={r} />
          {r.source && <SourceTag source={r.source} />}
        </li>
      ))}
    </ul>
  );
}
