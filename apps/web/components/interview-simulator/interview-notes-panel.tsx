import type { Persona } from "@personalab/core";
import { generateMockInterviewNotes } from "./mock-interview-notes";
import type { InterviewMessage, InterviewNotes } from "./types";

interface InterviewNotesPanelProps {
  persona: Persona;
  openQuestions: string[];
  conversation: InterviewMessage[];
}

const SECTIONS: Array<{ key: keyof InterviewNotes; label: string }> = [
  { key: "emergingInsights", label: "Emerging insights" },
  { key: "painPoints", label: "Pain points" },
  { key: "opportunities", label: "Opportunities" },
  { key: "unansweredQuestions", label: "Unanswered questions" },
];

export function InterviewNotesPanel({ persona, openQuestions, conversation }: InterviewNotesPanelProps) {
  const participantTurns = conversation.filter((message) => message.role === "participant").length;
  const askedQuestions = conversation.filter((message) => message.role === "researcher").map((message) => message.text);
  const notes = generateMockInterviewNotes(persona, openQuestions, participantTurns, askedQuestions);

  return (
    <aside className="space-y-5 rounded-lg border border-slate-200 bg-white p-5">
      {SECTIONS.map(({ key, label }) => (
        <div key={key}>
          <h2 className="text-sm font-semibold text-slate-800">{label}</h2>
          {notes[key].length === 0 ? (
            <p className="mt-2 text-sm text-slate-400">Nothing yet — ask a question to begin surfacing notes.</p>
          ) : (
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-slate-700">
              {notes[key].map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </aside>
  );
}
