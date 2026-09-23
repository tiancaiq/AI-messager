import { deleteUnsupported, type MemoryDatabase } from "./assertion-store.js";

// End decisions need their own evidence dependency. A contextual transition
// source must not become independent positive support for the underlying role.
export async function upgradeAssertionSchemaV6(database: MemoryDatabase): Promise<void> {
  await database.exec(`
    CREATE TABLE relationship_temporal_support (
      sequence INTEGER PRIMARY KEY AUTOINCREMENT,
      context_id TEXT NOT NULL,
      assertion_id TEXT NOT NULL,
      evidence_id TEXT NOT NULL,
      decision_id TEXT NOT NULL UNIQUE,
      end_certainty TEXT NOT NULL CHECK(end_certainty IN ('UNKNOWN','EXACT','WITHIN')),
      end_precision TEXT NOT NULL CHECK(end_precision IN ('UNKNOWN','YEAR','CALENDAR_MONTH','CALENDAR_DATE','INSTANT')),
      end_value TEXT,
      CHECK((end_certainty='UNKNOWN' AND end_precision='UNKNOWN' AND end_value IS NULL) OR
            (end_certainty<>'UNKNOWN' AND end_precision<>'UNKNOWN' AND end_value IS NOT NULL AND
             NOT(end_certainty='WITHIN' AND end_precision='INSTANT'))),
      FOREIGN KEY(context_id,assertion_id) REFERENCES memory_assertion(context_id,id) ON DELETE CASCADE,
      FOREIGN KEY(context_id,evidence_id) REFERENCES memory_evidence(context_id,id) ON DELETE CASCADE,
      FOREIGN KEY(context_id,decision_id) REFERENCES memory_decision(context_id,id) ON DELETE CASCADE
    );
    CREATE INDEX relationship_temporal_evidence ON relationship_temporal_support(context_id,evidence_id,assertion_id);
    CREATE INDEX relationship_temporal_assertion ON relationship_temporal_support(context_id,assertion_id,sequence DESC);
    CREATE TRIGGER relationship_temporal_parent_insert BEFORE INSERT ON relationship_temporal_support
      WHEN NOT EXISTS(SELECT 1 FROM memory_decision d JOIN relationship_assertion_scope s
        ON s.assertion_id=d.assertion_id AND s.context_id=d.context_id
        WHERE d.id=NEW.decision_id AND d.context_id=NEW.context_id AND
          d.assertion_id=NEW.assertion_id AND d.operation='TRANSITION')
        OR NOT EXISTS(SELECT 1 FROM assertion_evidence_link l
          WHERE l.context_id=NEW.context_id AND l.assertion_id=NEW.assertion_id AND
            l.evidence_id=NEW.evidence_id AND l.role IN ('SUPPORTS','CONTEXTUALIZES'))
      BEGIN SELECT RAISE(ABORT,'invalid temporal support parent'); END;
  `);

  // v5 recorded no transition-to-evidence edge. Attribute only the latest
  // transition if its timestamp identifies exactly one linked source. An
  // ambiguous old end cannot safely survive as a known boundary.
  await database.exec(`
    INSERT INTO relationship_temporal_support(
      context_id,assertion_id,evidence_id,decision_id,end_certainty,end_precision,end_value)
    SELECT d.context_id,d.assertion_id,e.id,d.id,s.end_certainty,s.end_precision,s.end_value
    FROM memory_decision d JOIN relationship_assertion_scope s ON s.assertion_id=d.assertion_id
      JOIN assertion_evidence_link l ON l.context_id=d.context_id AND l.assertion_id=d.assertion_id
      JOIN memory_evidence e ON e.context_id=l.context_id AND e.id=l.evidence_id
    WHERE d.operation='TRANSITION' AND l.role='SUPPORTS' AND e.recorded_at=d.created_at
      AND d.id=(SELECT latest.id FROM memory_decision latest
        WHERE latest.context_id=d.context_id AND latest.assertion_id=d.assertion_id
          AND latest.operation='TRANSITION'
        ORDER BY latest.created_at DESC,latest.rowid DESC LIMIT 1)
      AND 1=(SELECT COUNT(*) FROM assertion_evidence_link unique_link
        JOIN memory_evidence unique_e ON unique_e.context_id=unique_link.context_id
          AND unique_e.id=unique_link.evidence_id
        WHERE unique_link.context_id=d.context_id AND unique_link.assertion_id=d.assertion_id
          AND unique_link.role='SUPPORTS' AND unique_e.recorded_at=d.created_at);
    UPDATE assertion_evidence_link SET role='CONTEXTUALIZES'
      WHERE EXISTS(SELECT 1 FROM relationship_temporal_support t
        WHERE t.context_id=assertion_evidence_link.context_id
          AND t.assertion_id=assertion_evidence_link.assertion_id
          AND t.evidence_id=assertion_evidence_link.evidence_id);
    UPDATE relationship_assertion_scope SET
      end_certainty='UNKNOWN',end_precision='UNKNOWN',end_value=NULL
      WHERE assertion_id IN (SELECT d.assertion_id FROM memory_decision d
        WHERE d.operation='TRANSITION' AND NOT EXISTS(
          SELECT 1 FROM relationship_temporal_support t WHERE t.assertion_id=d.assertion_id));
    UPDATE memory_assertion SET applicability='UNKNOWN',revision=revision+1,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')
      WHERE id IN (SELECT d.assertion_id FROM memory_decision d
        WHERE d.operation='TRANSITION' AND NOT EXISTS(
          SELECT 1 FROM relationship_temporal_support t WHERE t.assertion_id=d.assertion_id))
        AND applicability='HISTORICAL';
  `);
  const context = await database.get("SELECT context_id FROM local_context WHERE singleton=1");
  if (!context?.context_id) throw new Error("missing migration context");
  await deleteUnsupported(database, String(context.context_id));
}
