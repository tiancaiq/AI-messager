import type { MemoryDatabase } from "./assertion-store.js";

// This migration runs with foreign keys temporarily disabled by the utility process.
// Every former row is copied, and foreign_key_check is required before commit.
export async function upgradeAssertionSchemaV5(database: MemoryDatabase): Promise<void> {
  await database.exec(`
    CREATE TABLE memory_assertion_v5 (
      id TEXT PRIMARY KEY,
      context_id TEXT NOT NULL,
      subject_kind TEXT NOT NULL CHECK(subject_kind IN ('LOCAL_USER','CONTACT')),
      subject_key TEXT NOT NULL,
      contact_id TEXT,
      predicate TEXT NOT NULL CHECK(predicate IN ('REPLY_LENGTH_PREFERENCE','RELATIONSHIP_CATEGORY','RELATIONSHIP_ROLE')),
      preference_value TEXT CHECK(preference_value IN ('CONCISE','BALANCED','DETAILED')),
      acceptance TEXT NOT NULL CHECK(acceptance IN ('CANDIDATE','CONFIRMED','REJECTED')),
      lifecycle TEXT NOT NULL CHECK(lifecycle IN ('ACTIVE','SUPERSEDED')),
      applicability TEXT NOT NULL CHECK(applicability IN ('CURRENT','HISTORICAL','UNKNOWN')),
      valid_time_precision TEXT NOT NULL CHECK(valid_time_precision IN ('UNKNOWN','INSTANT','CALENDAR_DATE','CALENDAR_MONTH')),
      valid_time_value TEXT,
      valid_time_end_exclusive TEXT,
      revision INTEGER NOT NULL CHECK(revision > 0),
      replaces_assertion_id TEXT,
      reconsidered_decision_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      CHECK((subject_kind='LOCAL_USER' AND subject_key='LOCAL_USER' AND contact_id IS NULL) OR
            (subject_kind='CONTACT' AND subject_key=contact_id AND contact_id IS NOT NULL)),
      CHECK((valid_time_precision='UNKNOWN' AND valid_time_value IS NULL AND valid_time_end_exclusive IS NULL) OR
            (valid_time_precision<>'UNKNOWN' AND valid_time_value IS NOT NULL)),
      CHECK((predicate='REPLY_LENGTH_PREFERENCE' AND preference_value IS NOT NULL) OR
            (predicate<>'REPLY_LENGTH_PREFERENCE' AND preference_value IS NULL AND subject_kind='CONTACT'
             AND valid_time_precision='UNKNOWN')),
      UNIQUE(context_id,id),
      FOREIGN KEY(context_id,contact_id) REFERENCES contact(context_id,id) ON DELETE CASCADE,
      FOREIGN KEY(replaces_assertion_id) REFERENCES memory_assertion_v5(id) ON DELETE SET NULL,
      FOREIGN KEY(reconsidered_decision_id) REFERENCES memory_decision_v5(id) ON DELETE SET NULL
    );
    CREATE TABLE memory_evidence_v5 (
      id TEXT PRIMARY KEY,
      context_id TEXT NOT NULL,
      subject_kind TEXT NOT NULL CHECK(subject_kind IN ('LOCAL_USER','CONTACT')),
      subject_key TEXT NOT NULL,
      contact_id TEXT,
      predicate TEXT NOT NULL CHECK(predicate IN ('REPLY_LENGTH_PREFERENCE','RELATIONSHIP_CATEGORY','RELATIONSHIP_ROLE')),
      preference_value TEXT CHECK(preference_value IN ('CONCISE','BALANCED','DETAILED')),
      source TEXT NOT NULL CHECK(source IN ('USER_SETTING','LEGACY_SETTING_MIGRATION','SYNTHETIC_FIXTURE')),
      source_reference TEXT NOT NULL,
      source_time_precision TEXT NOT NULL CHECK(source_time_precision IN ('UNKNOWN','INSTANT','CALENDAR_DATE','CALENDAR_MONTH')),
      source_time_value TEXT,
      source_time_end_exclusive TEXT,
      confidence_extraction REAL,
      confidence_attribution REAL,
      confidence_predicate REAL,
      association_id TEXT,
      association_revision INTEGER,
      recorded_at TEXT NOT NULL,
      CHECK((subject_kind='LOCAL_USER' AND subject_key='LOCAL_USER' AND contact_id IS NULL) OR
            (subject_kind='CONTACT' AND subject_key=contact_id AND contact_id IS NOT NULL)),
      CHECK((source_time_precision='UNKNOWN' AND source_time_value IS NULL AND source_time_end_exclusive IS NULL) OR
            (source_time_precision<>'UNKNOWN' AND source_time_value IS NOT NULL)),
      CHECK((association_id IS NULL AND association_revision IS NULL) OR
            (association_id IS NOT NULL AND association_revision > 0)),
      CHECK((predicate='REPLY_LENGTH_PREFERENCE' AND preference_value IS NOT NULL) OR
            (predicate<>'REPLY_LENGTH_PREFERENCE' AND preference_value IS NULL AND subject_kind='CONTACT'
             AND source='SYNTHETIC_FIXTURE')),
      UNIQUE(context_id,id),
      UNIQUE(context_id,source,source_reference),
      FOREIGN KEY(context_id,contact_id) REFERENCES contact(context_id,id) ON DELETE CASCADE,
      FOREIGN KEY(context_id,association_id) REFERENCES identity_association(context_id,id) ON DELETE CASCADE
    );
    CREATE TABLE assertion_evidence_link_v5 (
      context_id TEXT NOT NULL,
      assertion_id TEXT NOT NULL,
      evidence_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('SUPPORTS','CONTRADICTS','CONTEXTUALIZES')),
      created_at TEXT NOT NULL,
      PRIMARY KEY(context_id,assertion_id,evidence_id),
      FOREIGN KEY(context_id,assertion_id) REFERENCES memory_assertion_v5(context_id,id) ON DELETE CASCADE,
      FOREIGN KEY(context_id,evidence_id) REFERENCES memory_evidence_v5(context_id,id) ON DELETE CASCADE
    );
    CREATE TABLE memory_decision_v5 (
      id TEXT PRIMARY KEY,
      context_id TEXT NOT NULL,
      assertion_id TEXT NOT NULL,
      assertion_revision INTEGER NOT NULL CHECK(assertion_revision > 0),
      operation TEXT NOT NULL CHECK(operation IN ('CONFIRM','REJECT','REPLACE','RECONSIDER','TRANSITION','FACT_CORRECT')),
      authority TEXT NOT NULL CHECK(authority IN ('USER_SETTING','TRUSTED_USER_DECISION','LEGACY_MIGRATION','SYNTHETIC_FIXTURE')),
      replacement_assertion_id TEXT,
      reconsidered_decision_id TEXT,
      created_at TEXT NOT NULL,
      UNIQUE(context_id,id),
      FOREIGN KEY(context_id,assertion_id) REFERENCES memory_assertion_v5(context_id,id) ON DELETE CASCADE,
      FOREIGN KEY(replacement_assertion_id) REFERENCES memory_assertion_v5(id) ON DELETE SET NULL,
      FOREIGN KEY(reconsidered_decision_id) REFERENCES memory_decision_v5(id) ON DELETE SET NULL
    );
    INSERT INTO memory_assertion_v5 SELECT * FROM memory_assertion;
    INSERT INTO memory_evidence_v5 SELECT * FROM memory_evidence;
    INSERT INTO assertion_evidence_link_v5 SELECT * FROM assertion_evidence_link;
    INSERT INTO memory_decision_v5 SELECT * FROM memory_decision;
    DROP TABLE assertion_evidence_link;
    DROP TABLE memory_decision;
    DROP TABLE memory_assertion;
    DROP TABLE memory_evidence;
    ALTER TABLE memory_assertion_v5 RENAME TO memory_assertion;
    ALTER TABLE memory_evidence_v5 RENAME TO memory_evidence;
    ALTER TABLE assertion_evidence_link_v5 RENAME TO assertion_evidence_link;
    ALTER TABLE memory_decision_v5 RENAME TO memory_decision;

    CREATE TABLE relationship_context (
      id TEXT PRIMARY KEY,
      context_id TEXT NOT NULL,
      contact_id TEXT NOT NULL,
      kind TEXT NOT NULL CHECK(kind IN ('GENERAL','UNKNOWN','ORGANIZATION','PROJECT')),
      organization_label TEXT,
      project_label TEXT,
      created_at TEXT NOT NULL,
      CHECK((kind IN ('GENERAL','UNKNOWN') AND organization_label IS NULL AND project_label IS NULL) OR
            (kind='ORGANIZATION' AND organization_label IS NOT NULL AND project_label IS NULL) OR
            (kind='PROJECT' AND project_label IS NOT NULL)),
      CHECK((organization_label IS NULL OR (length(organization_label) BETWEEN 1 AND 120 AND
             length(CAST(organization_label AS BLOB))<=480)) AND
            (project_label IS NULL OR (length(project_label) BETWEEN 1 AND 120 AND
             length(CAST(project_label AS BLOB))<=480))),
      CHECK(length(CAST(coalesce(organization_label,'') || coalesce(project_label,'') AS BLOB))<=1024),
      UNIQUE(context_id,contact_id,id),
      FOREIGN KEY(context_id,contact_id) REFERENCES contact(context_id,id) ON DELETE CASCADE
    );
    CREATE TABLE relationship_assertion_scope (
      assertion_id TEXT PRIMARY KEY,
      context_id TEXT NOT NULL,
      contact_id TEXT NOT NULL,
      context_ref TEXT NOT NULL,
      episode_id TEXT NOT NULL,
      category TEXT CHECK(category IN ('PROFESSIONAL','PERSONAL')),
      role TEXT CHECK(role IN ('MANAGER','COWORKER','TEAMMATE','CLIENT','PROFESSOR','FRIEND','ROMANTIC_PARTNER','SPOUSE','FAMILY','ACQUAINTANCE')),
      direction TEXT NOT NULL CHECK(direction IN ('LOCAL_USER','CONTACT','SYMMETRIC')),
      start_precision TEXT NOT NULL CHECK(start_precision IN ('UNKNOWN','YEAR','CALENDAR_MONTH','CALENDAR_DATE','INSTANT')),
      start_value TEXT,
      end_certainty TEXT NOT NULL CHECK(end_certainty IN ('UNKNOWN','EXACT','WITHIN')),
      end_precision TEXT NOT NULL CHECK(end_precision IN ('UNKNOWN','YEAR','CALENDAR_MONTH','CALENDAR_DATE','INSTANT')),
      end_value TEXT,
      CHECK((category IS NOT NULL AND role IS NULL AND direction='SYMMETRIC') OR
            (category IS NULL AND role IS NOT NULL AND
             ((role IN ('MANAGER','CLIENT','PROFESSOR') AND direction<>'SYMMETRIC') OR
              (role NOT IN ('MANAGER','CLIENT','PROFESSOR') AND direction='SYMMETRIC')))),
      CHECK((start_precision='UNKNOWN')=(start_value IS NULL)),
      CHECK((end_certainty='UNKNOWN' AND end_precision='UNKNOWN' AND end_value IS NULL) OR
            (end_certainty<>'UNKNOWN' AND end_precision<>'UNKNOWN' AND end_value IS NOT NULL AND
             NOT(end_certainty='WITHIN' AND end_precision='INSTANT'))),
      FOREIGN KEY(assertion_id) REFERENCES memory_assertion(id) ON DELETE CASCADE,
      FOREIGN KEY(context_id,contact_id,context_ref) REFERENCES relationship_context(context_id,contact_id,id)
    );
    CREATE TABLE relationship_evidence_scope (
      evidence_id TEXT PRIMARY KEY,
      context_id TEXT NOT NULL,
      contact_id TEXT NOT NULL,
      context_ref TEXT NOT NULL,
      episode_id TEXT NOT NULL,
      category TEXT CHECK(category IN ('PROFESSIONAL','PERSONAL')),
      role TEXT CHECK(role IN ('MANAGER','COWORKER','TEAMMATE','CLIENT','PROFESSOR','FRIEND','ROMANTIC_PARTNER','SPOUSE','FAMILY','ACQUAINTANCE')),
      direction TEXT NOT NULL CHECK(direction IN ('LOCAL_USER','CONTACT','SYMMETRIC')),
      polarity TEXT NOT NULL CHECK(polarity IN ('POSITIVE','NEGATIVE')),
      CHECK((category IS NOT NULL AND role IS NULL AND direction='SYMMETRIC') OR
            (category IS NULL AND role IS NOT NULL AND
             ((role IN ('MANAGER','CLIENT','PROFESSOR') AND direction<>'SYMMETRIC') OR
              (role NOT IN ('MANAGER','CLIENT','PROFESSOR') AND direction='SYMMETRIC')))),
      FOREIGN KEY(evidence_id) REFERENCES memory_evidence(id) ON DELETE CASCADE,
      FOREIGN KEY(context_id,contact_id,context_ref) REFERENCES relationship_context(context_id,contact_id,id)
    );
    CREATE TABLE relationship_decision_scope (
      decision_id TEXT PRIMARY KEY,
      reach TEXT NOT NULL CHECK(reach IN ('CURRENT','INTERVAL','ALL_HISTORY')),
      start_precision TEXT NOT NULL CHECK(start_precision IN ('UNKNOWN','YEAR','CALENDAR_MONTH','CALENDAR_DATE','INSTANT')),
      start_value TEXT,
      end_certainty TEXT NOT NULL CHECK(end_certainty IN ('UNKNOWN','EXACT','WITHIN')),
      end_precision TEXT NOT NULL CHECK(end_precision IN ('UNKNOWN','YEAR','CALENDAR_MONTH','CALENDAR_DATE','INSTANT')),
      end_value TEXT,
      CHECK((reach='INTERVAL' AND (start_precision<>'UNKNOWN' OR end_certainty<>'UNKNOWN')) OR
            (reach<>'INTERVAL' AND start_precision='UNKNOWN' AND end_certainty='UNKNOWN')),
      CHECK((start_precision='UNKNOWN')=(start_value IS NULL)),
      CHECK((end_certainty='UNKNOWN' AND end_precision='UNKNOWN' AND end_value IS NULL) OR
            (end_certainty<>'UNKNOWN' AND end_precision<>'UNKNOWN' AND end_value IS NOT NULL)),
      FOREIGN KEY(decision_id) REFERENCES memory_decision(id) ON DELETE CASCADE
    );
    CREATE TRIGGER relationship_assertion_parent_insert BEFORE INSERT ON relationship_assertion_scope
      WHEN NOT EXISTS(SELECT 1 FROM memory_assertion a WHERE a.id=NEW.assertion_id AND
                      a.context_id=NEW.context_id AND a.contact_id=NEW.contact_id AND
                      ((a.predicate='RELATIONSHIP_CATEGORY' AND NEW.category IS NOT NULL) OR
                       (a.predicate='RELATIONSHIP_ROLE' AND NEW.role IS NOT NULL)))
      BEGIN SELECT RAISE(ABORT,'invalid relationship assertion parent'); END;
    CREATE TRIGGER relationship_evidence_parent_insert BEFORE INSERT ON relationship_evidence_scope
      WHEN NOT EXISTS(SELECT 1 FROM memory_evidence e WHERE e.id=NEW.evidence_id AND
                      e.context_id=NEW.context_id AND e.contact_id=NEW.contact_id AND
                      ((e.predicate='RELATIONSHIP_CATEGORY' AND NEW.category IS NOT NULL) OR
                       (e.predicate='RELATIONSHIP_ROLE' AND NEW.role IS NOT NULL)))
      BEGIN SELECT RAISE(ABORT,'invalid relationship evidence parent'); END;
    CREATE TRIGGER assertion_reference_context_insert BEFORE INSERT ON memory_assertion
      WHEN (NEW.replaces_assertion_id IS NOT NULL AND NOT EXISTS(
        SELECT 1 FROM memory_assertion WHERE context_id=NEW.context_id AND id=NEW.replaces_assertion_id
      )) OR (NEW.reconsidered_decision_id IS NOT NULL AND NOT EXISTS(
        SELECT 1 FROM memory_decision WHERE context_id=NEW.context_id AND id=NEW.reconsidered_decision_id
      )) BEGIN SELECT RAISE(ABORT,'invalid assertion reference'); END;
    CREATE TRIGGER decision_reference_context_insert BEFORE INSERT ON memory_decision
      WHEN (NEW.replacement_assertion_id IS NOT NULL AND NOT EXISTS(
        SELECT 1 FROM memory_assertion WHERE context_id=NEW.context_id AND id=NEW.replacement_assertion_id
      )) OR (NEW.reconsidered_decision_id IS NOT NULL AND NOT EXISTS(
        SELECT 1 FROM memory_decision WHERE context_id=NEW.context_id AND id=NEW.reconsidered_decision_id
      )) BEGIN SELECT RAISE(ABORT,'invalid decision reference'); END;
    CREATE INDEX assertion_page_order ON memory_assertion(context_id,id);
    CREATE INDEX evidence_page_order ON memory_evidence(context_id,id);
    CREATE INDEX link_page_order ON assertion_evidence_link(context_id,assertion_id,evidence_id);
    CREATE INDEX decision_page_order ON memory_decision(context_id,id);
    CREATE INDEX assertion_subject_history ON memory_assertion(context_id,subject_key,predicate,created_at);
    CREATE INDEX evidence_association_dependency ON memory_evidence(context_id,association_id,association_revision);
    CREATE INDEX relationship_context_page ON relationship_context(context_id,id);
    CREATE INDEX relationship_assertion_scope_lookup ON relationship_assertion_scope(contact_id,context_ref,role,direction,episode_id);
    CREATE INDEX relationship_evidence_scope_lookup ON relationship_evidence_scope(contact_id,context_ref,role,direction,episode_id);
    CREATE UNIQUE INDEX one_current_confirmed_assertion ON memory_assertion(context_id,subject_key,predicate)
      WHERE predicate='REPLY_LENGTH_PREFERENCE' AND acceptance='CONFIRMED' AND lifecycle='ACTIVE' AND applicability='CURRENT';
    CREATE INDEX relationship_episode_lookup ON relationship_assertion_scope(
      contact_id,context_ref,coalesce(category,role),direction,episode_id);
  `);
}
