import { append, id, now } from './store';
import type { AgentName, TraceEvent } from './schema';

// Agentic trace: actions and evidence references, never hidden reasoning.
// Every conclusion in the UI expands to the TraceEvents that produced it.
export function trace(e: {
  agent: AgentName;
  action: string;
  opportunity_id?: string | null;
  inputs?: TraceEvent['inputs'];
  output_refs?: string[];
  rule_version?: string;
}): TraceEvent {
  return append<TraceEvent>('trace_events', {
    trace_id: id('trc'),
    opportunity_id: e.opportunity_id ?? null,
    agent: e.agent,
    action: e.action,
    inputs: e.inputs ?? {},
    output_refs: e.output_refs ?? [],
    rule_version: e.rule_version ?? 'v1',
    at: now(),
  });
}
