import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { LocalMemoryInspectorView } from "./LocalMemoryInspector.js";

describe("development Local Memory Inspector", () => {
  it("renders implemented read-only sections without secret fields or later milestones", () => {
    const markup = renderToStaticMarkup(
      <LocalMemoryInspectorView
        loading={false}
        section="CONTACT"
        onRefresh={() => undefined}
        onNext={() => undefined}
        onSection={() => undefined}
        result={{
          ok: true,
          snapshot: {
            status: "READY",
            schemaVersion: 6,
            databasePath: "C:\\development\\memory.db",
            context: {
              storeId: "e2ce1e41-e2cb-4dd7-a762-55e64486300b",
              contextId: "36e36179-c269-41ac-9c8a-e666a4e2ec11",
              generation: "819c4d40-5a67-4a06-9e88-7776b784e3ce",
              settingsRevision: 4,
              directoryRevision: 2,
              memoryRevision: 3,
            },
            explicitPreferences: [
              {
                id: "messageLength",
                value: "CONCISE",
                source: "USER_SETTING",
                settingsRevision: 4,
                createdAt: "2026-09-14T01:02:03.000Z",
                updatedAt: "2026-09-14T02:03:04.000Z",
              },
            ],
            page: {
              kind: "PAGE",
              generation: "819c4d40-5a67-4a06-9e88-7776b784e3ce",
              directoryRevision: 2,
              recordType: "CONTACT",
              records: [
                {
                  recordType: "CONTACT",
                  id: "00000000-0000-4000-8000-000000000099",
                  label: "Synthetic Alex",
                  revision: 1,
                  createdAt: "2026-09-14T02:03:04.000Z",
                  updatedAt: "2026-09-14T02:03:04.000Z",
                },
              ],
              nextCursor: null,
            },
          },
        }}
      />,
    );

    expect(markup).toContain("Development only · read-only");
    expect(markup).toContain("Schema version");
    expect(markup).toContain("messageLength");
    expect(markup).toContain("2026-09-14T02:03:04.000Z");
    expect(markup).not.toContain("Encryption key");
    expect(markup).toContain("Contacts");
    expect(markup).toContain("Synthetic Alex");
    expect(markup).toContain("Memory assertions");
    expect(markup).toContain("Relationship contexts");
    expect(markup).not.toContain("Processing receipts");
  });

  it("renders a read-only typed assertion page", () => {
    const markup = renderToStaticMarkup(
      <LocalMemoryInspectorView
        loading={false}
        section="MEMORY_ASSERTION"
        onRefresh={() => undefined}
        onNext={() => undefined}
        onSection={() => undefined}
        onPredicate={() => undefined}
        predicateFilter="RELATIONSHIP_ROLE"
        result={{
          ok: true,
          snapshot: {
            status: "READY",
            schemaVersion: 6,
            databasePath: "C:\\development\\memory.db",
            context: {
              storeId: "e2ce1e41-e2cb-4dd7-a762-55e64486300b",
              contextId: "36e36179-c269-41ac-9c8a-e666a4e2ec11",
              generation: "819c4d40-5a67-4a06-9e88-7776b784e3ce",
              settingsRevision: 1,
              directoryRevision: 0,
              memoryRevision: 1,
            },
            explicitPreferences: [],
            page: {
              kind: "PAGE",
              generation: "819c4d40-5a67-4a06-9e88-7776b784e3ce",
              memoryRevision: 1,
              recordType: "MEMORY_ASSERTION",
              records: [
                {
                  recordType: "MEMORY_ASSERTION",
                  id: "00000000-0000-4000-8000-000000000099",
                  subject: { kind: "LOCAL_USER" },
                  predicate: "REPLY_LENGTH_PREFERENCE",
                  value: "CONCISE",
                  acceptance: "CONFIRMED",
                  lifecycle: "ACTIVE",
                  applicability: "CURRENT",
                  validTime: { precision: "UNKNOWN" },
                  revision: 1,
                  replacesAssertionId: null,
                  reconsideredDecisionId: null,
                  createdAt: "2026-09-15T00:00:00.000Z",
                  updatedAt: "2026-09-15T00:00:00.000Z",
                },
              ],
              nextCursor: null,
            },
          },
        }}
      />,
    );

    expect(markup).toContain("REPLY_LENGTH_PREFERENCE");
    expect(markup).toContain("CONFIRMED");
    expect(markup).toContain("Inspector predicate filter");
    expect(markup).not.toContain("Encryption key");
  });
});
