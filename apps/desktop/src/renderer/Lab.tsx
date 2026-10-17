import {
  LabRequestSchema,
  type LabRequest,
  type LabResult,
  type ProviderConfiguration,
  type CoachingSelection,
} from "@ai-message-coach/contracts";
import { useEffect, useRef, useState } from "react";
import "./lab.css";

const emptyInput: LabRequest = { draft: "", incoming: "", userContext: "", language: "en" };
const emptyRecipient = { name: "", relationship: "" };
const failureMessages = {
  INVALID_REQUEST: "Keep each message field within 10,000 characters and choose a valid option.",
  UNAVAILABLE: "The Lab is available only in the Electron development app.",
  UNSUPPORTED_ACTION:
    "This action is unavailable in the running app. Restart the development app and try again.",
  COACHING_IN_PROGRESS:
    "A coaching request is already running. Wait for it to finish, then run again.",
  LAB_FAILED: "The Lab could not validate this run. Clear it and try again.",
} as const;

function Structured({ value }: { value: unknown }) {
  return <pre className="lab-structure">{JSON.stringify(value, null, 2)}</pre>;
}

export function LabResultView({
  run,
  onSelect,
}: {
  run: LabResult;
  onSelect?: ((selection: CoachingSelection) => void) | undefined;
}) {
  if (!run.ok)
    return (
      <div role="alert" className="lab-notice">
        <p>{failureMessages[run.code]}</p>
        <code>
          {run.code}
          {run.action ? ` · ${run.action}` : ""}
        </code>
      </div>
    );
  const { trace, result } = run;
  const candidate = trace.validation.candidate;
  const decision = result.ok ? result.decision : null;
  const localDecision =
    decision &&
    ["SUGGEST_ACTIONS", "ASK_CLARIFICATION", "NO_REPLY_NEEDED"].includes(decision.action);
  const wording =
    candidate && (candidate.action === "REWRITE_DRAFT" || candidate.action === "COMPLETE_DRAFT")
      ? candidate
      : null;
  return (
    <div className="lab-run">
      <section
        className={`lab-result ${result.ok ? "" : "lab-rejected"}`}
        aria-labelledby="lab-result-title"
      >
        <p className="lab-kicker">
          {localDecision
            ? "Local policy decision · no provider call"
            : result.ok
              ? "Accepted by current guards"
              : "No accepted response"}
        </p>
        <h2 id="lab-result-title">
          {localDecision ? "Next step" : result.ok ? "Generated wording" : "Run stopped"}
        </h2>
        {decision?.action === "SUGGEST_ACTIONS" && (
          <>
            <p>What would you like to do?</p>
            <div className="lab-controls">
              {decision.actions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  className="button button-quiet"
                  disabled={!onSelect}
                  onClick={() => onSelect?.({ kind: "ACTION", ...action })}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </>
        )}
        {decision?.action === "ASK_CLARIFICATION" && (
          <>
            <p>{decision.question}</p>
            <div className="lab-controls">
              {decision.options.map((answer) => (
                <button
                  key={answer}
                  type="button"
                  className="button button-quiet"
                  disabled={!onSelect}
                  onClick={() => onSelect?.({ kind: "CLARIFICATION", answer })}
                >
                  {answer}
                </button>
              ))}
            </div>
          </>
        )}
        {decision?.action === "NO_REPLY_NEEDED" && (
          <>
            <h3>No reply needed</h3>
            <p>{decision.reason}</p>
            {decision.optionalReply && (
              <>
                <h3>Optional acknowledgment</h3>
                <p className="lab-message">{decision.optionalReply}</p>
              </>
            )}
          </>
        )}
        {candidate?.action === "SUGGEST_REPLY" && (
          <div className="lab-candidates">
            {!result.ok && <strong>Rejected candidate package — inspection only</strong>}
            {candidate.replies.map((reply, index) => (
              <div key={index}>
                <h3>{reply.label}</h3>
                <p className="lab-message">{reply.text}</p>
              </div>
            ))}
          </div>
        )}
        {!result.ok && (
          <p role="alert">
            {result.error.message} <code>{result.error.code}</code>
          </p>
        )}
        <dl className="lab-facts">
          <div>
            <dt>Fixed Agent action</dt>
            <dd>
              <code>{trace.fixedAction}</code>
            </dd>
          </div>
          <div>
            <dt>Validator stage</dt>
            <dd>
              <code>{trace.validation.stage}</code>
            </dd>
          </div>
          <div>
            <dt>First failing guard</dt>
            <dd>
              <code>{trace.validation.guardRule ?? "None reported"}</code>
            </dd>
          </div>
        </dl>
        {!localDecision && (
          <p className="lab-muted">
            A pass means the current bounded checks found no violation. Review the wording yourself.
            One rejected alternative rejects the whole package.
          </p>
        )}
        {trace.validation.stage === "ADAPTER_FAILURE" && (
          <p>
            The adapter returned a safe failure. Raw output and detailed upstream schema diagnostics
            are not available.
          </p>
        )}
        {trace.validation.stage === "RESULT_SCHEMA_REJECTED" && (
          <p>The normalized result failed its schema. Malformed content is withheld.</p>
        )}
        {trace.validation.stage === "NOT_REACHED" && (
          <p>
            {localDecision
              ? "This decision came from the existing local policy. Generated-output validation was not needed."
              : "Validation was not reached. No generated candidate is available."}
          </p>
        )}
        {wording && (
          <div className="lab-candidates">
            {!result.ok && <strong>Rejected candidate package — inspection only</strong>}
            <h3>Primary</h3>
            <p className="lab-message">{wording.primary}</p>
            {wording.alternatives.map((item, index) => (
              <div key={index}>
                <h3>
                  Alternative {index + 1} · {item.label}
                </h3>
                <p className="lab-message">{item.text}</p>
              </div>
            ))}
            {!wording.alternatives.length && <p className="lab-muted">No alternatives returned.</p>}
          </div>
        )}
      </section>
      <details className="lab-section" open>
        <summary>Production selection → Composer</summary>
        <p>
          The legacy selector is authoritative. It selects up to four skills in score order,
          breaking ties by skill ID. Score adds 12 for an intent match, 10 for a situation match, 3
          for a language-specific skill, and 8 for eligible Chinese code-switching.
        </p>
        {trace.ranking ? (
          <div
            className="lab-table-scroll"
            tabIndex={0}
            role="region"
            aria-label="Production skill candidates"
          >
            <table className="lab-table">
              <caption>All catalog skills · top-k cap {trace.ranking.maxSkills}</caption>
              <thead>
                <tr>
                  <th>Rank / score</th>
                  <th>Skill</th>
                  <th>Outcome and reason</th>
                </tr>
              </thead>
              <tbody>
                {trace.ranking.candidates.map((item) => (
                  <tr key={item.id}>
                    <td>{item.rank === null ? "—" : `${item.rank} / ${item.score}`}</td>
                    <td>
                      <code>{item.id}</code>
                      <small>{item.version}</small>
                    </td>
                    <td>
                      <strong>{item.outcome}</strong>
                      {item.reasons.map((reason, i) => (
                        <p key={i}>{reason}</p>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>Candidate diagnostics unavailable for this run.</p>
        )}
        <details>
          <summary>Derived production context and selected plan</summary>
          <Structured value={{ context: trace.context, plan: trace.productionPlan }} />
        </details>
        <h3>Guidance actually passed to Composer</h3>
        {trace.composerGuidance ? (
          <Structured value={trace.composerGuidance} />
        ) : (
          <p>Composer was not invoked. The selected plan above was not sent.</p>
        )}
      </details>
      <details className="lab-section lab-shadow">
        <summary>Shadow assessment & SkillPlan · not sent to Composer</summary>
        <p>
          The evidence-aware path runs locally for comparison. It does not control the generated
          wording. Detailed shadow candidate ranks and exclusions are not currently exposed;
          production ranks above do not represent shadow order.
        </p>
        {trace.shadow ? (
          <>
            <h3>Assessment and evidence signals</h3>
            <p className="lab-notice">
              Source: manual simulation. OBSERVED_SCREENSHOT labels below belong to the existing
              simulated analysis contract; no screen was captured. Confidence 1 represents your
              supplied fixture, not an extraction estimate.
            </p>
            <Structured
              value={
                trace.shadow.request
                  ? {
                      assessment: trace.shadow.request.assessment,
                      evidence: trace.shadow.request.evidence,
                      context: trace.shadow.request.context,
                      maxSkills: trace.shadow.request.maxSkills,
                      catalogSnapshotId: trace.shadow.request.catalogSnapshotId,
                    }
                  : null
              }
            />
            <h3>Selected skills and evidence-linked reasons</h3>
            <Structured value={trace.shadow.selection} />
            <h3>Compiled shadow SkillPlan</h3>
            <Structured value={trace.shadow.plan} />
          </>
        ) : (
          <p>Shadow details unavailable for this run.</p>
        )}
      </details>
      <p className="lab-muted">
        Unavailable in this slice: tool rankings, relationship memory, history retrieval,
        multi-agent behavior, provider payloads and private reasoning. Nothing here records or
        confirms a memory.
      </p>
    </div>
  );
}

export function Lab({ onClose }: { onClose: () => void }) {
  const [input, setInput] = useState<LabRequest>(emptyInput);
  // UI preview only: never combine these values with the transport input.
  const [recipient, setRecipient] = useState(emptyRecipient);
  const [run, setRun] = useState<LabResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [configuration, setConfiguration] = useState<ProviderConfiguration | null>(null);
  const [configurationChecked, setConfigurationChecked] = useState(false);
  const session = useRef(0);
  const draftRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    let active = true;
    draftRef.current?.focus();
    void window.messageCoach
      ?.getLabConfiguration?.()
      .then((value) => {
        if (active) {
          setConfiguration(value);
          setConfigurationChecked(true);
        }
      })
      .catch(() => {
        if (active) setConfigurationChecked(true);
      });
    return () => {
      active = false;
      session.current += 1;
    };
  }, []);

  function clear() {
    session.current += 1;
    setInput(emptyInput);
    setRecipient(emptyRecipient);
    setRun(null);
    draftRef.current?.focus();
  }
  async function start(selection: CoachingSelection | null = input.selection ?? null) {
    if (busy) return;
    const parsed = LabRequestSchema.safeParse({ ...input, selection });
    if (!parsed.success) {
      setRun({ ok: false, code: "INVALID_REQUEST", action: null });
      return;
    }
    const current = ++session.current;
    setInput(parsed.data);
    setBusy(true);
    setRun(null);
    try {
      const result = await window.messageCoach?.runLab?.(parsed.data);
      if (current === session.current)
        setRun(result ?? { ok: false, code: "UNAVAILABLE", action: null });
    } catch {
      if (current === session.current) setRun({ ok: false, code: "LAB_FAILED", action: null });
    } finally {
      setBusy(false);
    }
  }
  function edit(patch: Partial<LabRequest>) {
    session.current += 1;
    setInput((old) => ({ ...old, ...patch, selection: null }));
    setRun(null);
  }
  return (
    <main
      className="lab-shell"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          onClose();
        }
      }}
    >
      <header className="lab-header">
        <div>
          <p className="lab-kicker">Development only · current coaching pipeline</p>
          <h1>Message Lab</h1>
        </div>
        <button className="button button-quiet" type="button" onClick={onClose}>
          Close Lab
        </button>
      </header>
      <p>
        Try a conversation with or without a draft. Generation sends supplied message text to the
        configured AI provider; usage is billed by that provider. This app does not save Lab text or
        runs. Provider retention follows your provider settings.
      </p>
      <p className="lab-muted">
        No capture, sending or memory access. Clear or Close discards this view; an already
        submitted provider request may finish and incur usage. Escape closes the Lab.
      </p>
      <form
        className="lab-input"
        onSubmit={(event) => {
          event.preventDefault();
          void start();
        }}
      >
        <label htmlFor="lab-draft">
          Your draft <span>(optional)</span>
        </label>
        <textarea
          ref={draftRef}
          id="lab-draft"
          rows={5}
          maxLength={10_000}
          value={input.draft}
          onChange={(event) => edit({ draft: event.target.value })}
          placeholder="Add a draft to improve, or leave blank for help replying…"
          disabled={busy}
        />
        <details className="lab-recipient">
          <summary>
            Talking to (optional) <span className="lab-preview-label">UI preview</span>
          </summary>
          <p id="lab-recipient-note" className="lab-muted">
            Temporary name and relationship. Not used for generation yet, not sent to the AI
            provider, and not saved. Clear or Close removes both.
          </p>
          <div className="lab-context-grid">
            <div>
              <label htmlFor="lab-recipient-name">Name or nickname</label>
              <input
                id="lab-recipient-name"
                type="text"
                maxLength={120}
                autoComplete="off"
                aria-describedby="lab-recipient-note"
                placeholder="e.g. Alex"
                value={recipient.name}
                onChange={(event) => setRecipient((old) => ({ ...old, name: event.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="lab-recipient-relationship">Relationship to you</label>
              <input
                id="lab-recipient-relationship"
                type="text"
                maxLength={120}
                autoComplete="off"
                aria-describedby="lab-recipient-note"
                placeholder="e.g. friend, coworker, client"
                value={recipient.relationship}
                onChange={(event) =>
                  setRecipient((old) => ({ ...old, relationship: event.target.value }))
                }
              />
            </div>
          </div>
        </details>
        <details>
          <summary>Add conversation evidence (optional)</summary>
          <p className="lab-muted">
            No draft? Add the incoming message here. With no message context, the coach asks what
            you want to communicate.
          </p>
          <div className="lab-context-grid">
            <div>
              <label htmlFor="lab-incoming">
                Incoming message <span>(optional)</span>
              </label>
              <textarea
                id="lab-incoming"
                rows={3}
                maxLength={10_000}
                value={input.incoming}
                onChange={(event) => edit({ incoming: event.target.value })}
                disabled={busy}
              />
              <small>Attributed to the other person.</small>
            </div>
            <div>
              <label htmlFor="lab-context">
                Your earlier message <span>(optional)</span>
              </label>
              <textarea
                id="lab-context"
                rows={3}
                maxLength={10_000}
                value={input.userContext}
                onChange={(event) => edit({ userContext: event.target.value })}
                disabled={busy}
              />
              <small>
                Only words you already said. Passed as USER evidence before the incoming message;
                not an instruction or relationship fact.
              </small>
            </div>
          </div>
        </details>
        <div className="lab-controls">
          <div>
            <label htmlFor="lab-language">Input language</label>
            <select
              id="lab-language"
              value={input.language}
              onChange={(event) => edit({ language: event.target.value as LabRequest["language"] })}
              disabled={busy}
            >
              <option value="en">English</option>
              <option value="zh-Hans">简体中文</option>
              <option value="zh-Hant">繁體中文</option>
              <option value="mixed">English + 中文</option>
              <option value="other">Other / unknown · universal skills</option>
            </select>
          </div>
          <button type="submit" className="button button-primary" disabled={busy}>
            {busy
              ? "Running…"
              : input.selection
                ? "Generate again with this choice"
                : "Generate response"}
          </button>
          <button type="button" className="button button-quiet" onClick={clear}>
            Clear
          </button>
        </div>
        {input.selection && (
          <p className="lab-muted">
            Your choice:{" "}
            {input.selection.kind === "ACTION" ? input.selection.label : input.selection.answer}.
            Edit a message or Clear to start over.
          </p>
        )}
        <p className="lab-muted">
          Manual simulation: language and message ownership are supplied by you. No screenshot
          extraction or inferred relationship is tested.
        </p>
        <p role="status">
          {busy
            ? "Preparing a response… You can clear or close this view."
            : configuration
              ? `${configuration.providerId} · ${configuration.modelId} · ${configuration.configured ? "configured" : "key not configured — Run still shows local selection"}`
              : configurationChecked
                ? "Provider configuration unavailable."
                : "Checking text provider…"}
        </p>
        {configuration && !configuration.configured && (
          <p className="lab-notice">
            Use the existing development .env.local setup in this worktree, then restart the desktop
            app. Never paste your API key into a draft.
          </p>
        )}
      </form>
      <div aria-live="polite" aria-atomic="true" className="lab-muted">
        {run
          ? run.ok && run.result.ok
            ? "Run complete. Results below."
            : "Run stopped. Details below."
          : ""}
      </div>
      {run && (
        <LabResultView
          run={run}
          onSelect={busy ? undefined : (selection) => void start(selection)}
        />
      )}
    </main>
  );
}
