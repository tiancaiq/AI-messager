import type {
  DirectoryRecord,
  DirectoryRecordType,
  LocalMemoryInspectorResult,
  MemoryInspectorRecord,
  MemoryInspectorRecordType,
} from "@ai-message-coach/contracts";
import { useCallback, useEffect, useState } from "react";

function InspectorField({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>
        <code>{value}</code>
      </dd>
    </div>
  );
}

type InspectorSection = DirectoryRecordType | MemoryInspectorRecordType;
type InspectorRecord = DirectoryRecord | MemoryInspectorRecord;
type PredicateFilter =
  "ALL" | "REPLY_LENGTH_PREFERENCE" | "RELATIONSHIP_CATEGORY" | "RELATIONSHIP_ROLE";

function recordId(record: InspectorRecord): string {
  return record.recordType === "MEMORY_EVIDENCE_LINK"
    ? `${record.assertionId}:${record.evidenceId}`
    : record.id;
}

function RecordDetails({ record }: { record: InspectorRecord }) {
  if (record.recordType === "CONTACT") return <>{record.label}</>;
  if (record.recordType === "PLATFORM_IDENTITY") {
    return (
      <>
        {[
          record.platform,
          record.namespace,
          record.identifierKind,
          record.identifierValue,
          record.displayLabel,
        ]
          .filter(Boolean)
          .join(" · ") || "Unknown"}
      </>
    );
  }
  if (record.recordType === "IDENTITY_ASSOCIATION")
    return (
      <>
        {record.identityId} → {record.contactId} · {record.status}
      </>
    );
  return (
    <>
      <code>{JSON.stringify(record)}</code>
    </>
  );
}

export function LocalMemoryInspectorView({
  loading,
  onNext,
  onRefresh,
  onSection,
  onPredicate,
  predicateFilter = "ALL",
  result,
  section,
}: {
  loading: boolean;
  onNext: () => void;
  onRefresh: () => void;
  onSection: (section: InspectorSection) => void;
  onPredicate?: (predicate: PredicateFilter) => void;
  predicateFilter?: PredicateFilter;
  result: LocalMemoryInspectorResult | undefined;
  section: InspectorSection;
}) {
  const available = result?.ok === true;
  return (
    <details className="memory-inspector">
      <summary>
        Local Memory Inspector
        <span className="development-badge">Development only · read-only</span>
      </summary>
      <div className="memory-inspector-body">
        <div className="memory-inspector-heading">
          <div>
            <p className="result-label">Database availability</p>
            <strong>{loading ? "Checking…" : available ? "Ready" : "Unavailable"}</strong>
          </div>
          <button
            className="button button-quiet"
            disabled={loading}
            type="button"
            onClick={onRefresh}
          >
            Refresh
          </button>
        </div>
        {result?.ok === false ? (
          <p className="inline-error" role="status">
            {result.error.message}
          </p>
        ) : null}
        {result?.ok === true ? (
          <>
            <dl className="memory-inspector-facts">
              <InspectorField label="Schema version" value={result.snapshot.schemaVersion} />
              <InspectorField label="Store ID" value={result.snapshot.context.storeId} />
              <InspectorField label="Context ID" value={result.snapshot.context.contextId} />
              <InspectorField label="Generation ID" value={result.snapshot.context.generation} />
              <InspectorField
                label="Settings revision"
                value={result.snapshot.context.settingsRevision}
              />
              <InspectorField
                label="Directory revision"
                value={result.snapshot.context.directoryRevision}
              />
              <InspectorField
                label="Memory revision"
                value={result.snapshot.context.memoryRevision}
              />
              <InspectorField label="Database path" value={result.snapshot.databasePath} />
            </dl>
            <section className="memory-inspector-section">
              <h3>Explicit preferences</h3>
              {result.snapshot.explicitPreferences.length === 0 ? (
                <p className="empty-result">No explicit preference records.</p>
              ) : (
                <div className="memory-inspector-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Value</th>
                        <th>Revision</th>
                        <th>Created</th>
                        <th>Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.snapshot.explicitPreferences.map((preference) => (
                        <tr key={preference.id}>
                          <td>{preference.id}</td>
                          <td>{preference.value}</td>
                          <td>{preference.settingsRevision}</td>
                          <td>{preference.createdAt}</td>
                          <td>{preference.updatedAt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
            <section className="memory-inspector-section">
              <div className="memory-inspector-heading">
                <h3>Stored records</h3>
                <select
                  aria-label="Inspector storage section"
                  value={section}
                  onChange={(event) => onSection(event.target.value as InspectorSection)}
                >
                  <option value="CONTACT">Contacts</option>
                  <option value="PLATFORM_IDENTITY">Platform identities</option>
                  <option value="IDENTITY_ASSOCIATION">Identity associations</option>
                  <option value="MEMORY_ASSERTION">Memory assertions</option>
                  <option value="MEMORY_EVIDENCE">Evidence</option>
                  <option value="MEMORY_EVIDENCE_LINK">Evidence links</option>
                  <option value="MEMORY_DECISION">Memory decisions</option>
                  <option value="RELATIONSHIP_CONTEXT">Relationship contexts</option>
                </select>
              </div>
              {(section === "MEMORY_ASSERTION" || section === "MEMORY_EVIDENCE") && onPredicate ? (
                <select
                  aria-label="Inspector predicate filter"
                  value={predicateFilter}
                  onChange={(event) => onPredicate(event.target.value as PredicateFilter)}
                >
                  <option value="ALL">All predicates</option>
                  <option value="REPLY_LENGTH_PREFERENCE">Explicit preferences</option>
                  <option value="RELATIONSHIP_CATEGORY">Relationship categories</option>
                  <option value="RELATIONSHIP_ROLE">Relationship roles</option>
                </select>
              ) : null}
              {result.snapshot.page.records.length === 0 ? (
                <p className="empty-result">No records on this page.</p>
              ) : (
                <div className="memory-inspector-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Details</th>
                        <th>Revision</th>
                        <th>Created</th>
                        <th>Updated/decision</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.snapshot.page.records.map((record) => (
                        <tr key={recordId(record)}>
                          <td>{recordId(record)}</td>
                          <td>
                            <RecordDetails record={record} />
                          </td>
                          <td>{"revision" in record ? record.revision : "—"}</td>
                          <td>{"createdAt" in record ? record.createdAt : record.recordedAt}</td>
                          <td>
                            {record.recordType === "IDENTITY_ASSOCIATION"
                              ? (record.revokedAt ?? record.decidedAt ?? "—")
                              : "updatedAt" in record
                                ? record.updatedAt
                                : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {result.snapshot.page.nextCursor ? (
                <button
                  className="button button-quiet"
                  disabled={loading}
                  type="button"
                  onClick={onNext}
                >
                  Next page
                </button>
              ) : null}
            </section>
          </>
        ) : null}
      </div>
    </details>
  );
}

export function LocalMemoryInspector() {
  const [result, setResult] = useState<LocalMemoryInspectorResult>();
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<InspectorSection>("CONTACT");
  const [predicateFilter, setPredicateFilter] = useState<PredicateFilter>("ALL");

  const load = useCallback(
    async (cursor?: string) => {
      const inspect = window.messageCoach?.inspectLocalMemory;
      if (!inspect) return;
      setLoading(true);
      try {
        const filter =
          (section === "MEMORY_ASSERTION" || section === "MEMORY_EVIDENCE") &&
          predicateFilter !== "ALL"
            ? {
                contactId: null,
                predicate: predicateFilter,
                relationshipContextId: null,
                asOf: null,
              }
            : null;
        setResult(await inspect({ section, filter, limit: 20, cursor: cursor ?? null }));
      } catch {
        setResult({
          ok: false,
          error: { code: "STORE_UNAVAILABLE", message: "Local memory is unavailable." },
        });
      } finally {
        setLoading(false);
      }
    },
    [section, predicateFilter],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const nextCursor = result?.ok ? result.snapshot.page.nextCursor : null;
  return (
    <LocalMemoryInspectorView
      loading={loading}
      result={result}
      section={section}
      predicateFilter={predicateFilter}
      onRefresh={() => void load()}
      onNext={() => void load(nextCursor ?? undefined)}
      onSection={setSection}
      onPredicate={setPredicateFilter}
    />
  );
}
