"use client";

import { useRef, useState, type FormEvent } from "react";
import { DEFAULT_PERSONA_FORM_VALUES, type PersonaFormValues } from "@/lib/types";
import { AlertIcon } from "./icons";
import { PersonaCountControl } from "./persona-count-control";
import { Button } from "./ui/button";

const BRIEF_DESCRIPTION_THRESHOLD = 25;

interface PersonaInputFormProps {
  initialValues?: PersonaFormValues;
  onSubmit: (values: PersonaFormValues) => void;
}

export function PersonaInputForm({ initialValues, onSubmit }: PersonaInputFormProps) {
  const [values, setValues] = useState<PersonaFormValues>(initialValues ?? DEFAULT_PERSONA_FORM_VALUES);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const trimmedDescription = values.productDescription.trim();
  const isBrief = trimmedDescription.length > 0 && trimmedDescription.length < BRIEF_DESCRIPTION_THRESHOLD;

  function updateDescription(next: string) {
    setValues((v) => ({ ...v, productDescription: next }));
    if (descriptionError && next.trim()) {
      setDescriptionError(null);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!trimmedDescription) {
      setDescriptionError(
        "Add a short description of your product so PersonaLab has something to work with."
      );
      descriptionRef.current?.focus();
      return;
    }
    setDescriptionError(null);
    onSubmit({
      ...values,
      productDescription: trimmedDescription,
      targetContext: values.targetContext.trim(),
      knownUserData: values.knownUserData.trim(),
    });
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-2">
        <label htmlFor="product-description" className="block text-base font-medium text-slate-900">
          Product Description <span aria-hidden="true" className="text-slate-500">*</span>
          <span className="sr-only"> (required)</span>
        </label>
        <textarea
          id="product-description"
          ref={descriptionRef}
          value={values.productDescription}
          onChange={(e) => updateDescription(e.target.value)}
          placeholder='e.g. "A budgeting app for freelancers to track irregular income."'
          rows={4}
          required
          aria-required="true"
          aria-invalid={descriptionError ? "true" : undefined}
          aria-describedby={
            descriptionError
              ? "product-description-error"
              : isBrief
                ? "product-description-hint"
                : undefined
          }
          className={`block w-full rounded-md border px-3 py-2 text-base shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-700 ${
            descriptionError ? "border-red-400" : "border-slate-300"
          }`}
        />
        {descriptionError ? (
          <p id="product-description-error" role="alert" className="flex items-start gap-1.5 text-base text-red-700">
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {descriptionError}
          </p>
        ) : isBrief ? (
          <p id="product-description-hint" className="text-base text-slate-600">
            A bit more detail helps — try including who it&rsquo;s for and what problem it solves.
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="target-context" className="block text-base font-medium text-slate-900">
          Target Users / Context <span className="ml-1 text-sm font-normal text-slate-500">(optional)</span>
        </label>
        <p id="target-context-hint" className="text-base text-slate-600">
          Any specific market, platform, or use-case context?
        </p>
        <input
          id="target-context"
          type="text"
          value={values.targetContext}
          onChange={(e) => setValues((v) => ({ ...v, targetContext: e.target.value }))}
          aria-describedby="target-context-hint"
          className="block w-full rounded-md border border-slate-300 px-3 py-2 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="known-user-data" className="block text-base font-medium text-slate-900">
          Existing Research Notes <span className="ml-1 text-sm font-normal text-slate-500">(optional)</span>
        </label>
        <p id="known-user-data-hint" className="text-base text-slate-600">
          Paste real interview notes, survey data, or analytics findings. This is the only source
          PersonaLab will tag as &ldquo;Evidence.&rdquo; File upload isn&rsquo;t available yet — notes go here as
          text for now.
        </p>
        <textarea
          id="known-user-data"
          value={values.knownUserData}
          onChange={(e) => setValues((v) => ({ ...v, knownUserData: e.target.value }))}
          rows={4}
          aria-describedby="known-user-data-hint"
          className="block w-full rounded-md border border-slate-300 px-3 py-2 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
        />
      </div>

      <div className="space-y-2">
        <span id="persona-count-label" className="block text-base font-medium text-slate-900">
          Persona Count <span className="ml-1 text-sm font-normal text-slate-500">(optional)</span>
        </span>
        <PersonaCountControl
          value={values.personaCount}
          onChange={(next) => setValues((v) => ({ ...v, personaCount: next }))}
          labelledBy="persona-count-label"
        />
      </div>

      <div className="space-y-2 pt-2">
        <Button type="submit" variant="primary" className="w-full sm:w-auto">
          Generate Personas
        </Button>
        <p className="text-sm text-slate-600">
          Takes about 15–30 seconds. Nothing is saved after you leave this page.
        </p>
      </div>
    </form>
  );
}
