'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Arrow } from './site';

export function ContactForm({ initialTopic = '' }: { initialTopic?: string }) {
  const [state, setState] = useState<'idle' | 'sending' | 'error' | 'sent'>(
    'idle',
  );
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focused, setFocused] = useState('Your details');
  const status = useRef<HTMLDivElement>(null);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (form.current) form.current.noValidate = true;
  }, [state]);
  function fieldError(field: HTMLInputElement | HTMLTextAreaElement) {
    if (field.name === 'company') return '';
    if (field.type === 'radio')
      return field.validity.valueMissing
        ? 'Choose a topic for your message.'
        : '';
    if (!field.value.trim()) return `Please enter your ${field.name}.`;
    if (field.name === 'email' && field.validity.typeMismatch)
      return 'Please enter a valid email address.';
    if (field.name === 'message' && field.value.trim().length < 10)
      return 'Tell us a little more (at least 10 characters).';
    return '';
  }
  function validateField(field: HTMLInputElement | HTMLTextAreaElement) {
    setErrors((previous) => ({ ...previous, [field.name]: fieldError(field) }));
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === 'sending') return;
    const fields = Array.from(
      event.currentTarget.querySelectorAll<
        HTMLInputElement | HTMLTextAreaElement
      >('input, textarea'),
    );
    const nextErrors = Object.fromEntries(
      fields.map((field) => [field.name, fieldError(field)]),
    );
    setErrors(nextErrors);
    const invalid = fields.find((field) => nextErrors[field.name]);
    if (invalid) {
      requestAnimationFrame(() => invalid.focus());
      return;
    }
    const data = Object.fromEntries(new FormData(event.currentTarget));
    setState('sending');
    setError('');
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(
          typeof result.error === 'string'
            ? result.error
            : 'Your message could not be sent. Please try again.',
        );
      }
      setState('sent');
    } catch (problem) {
      setError(
        problem instanceof Error && problem.name !== 'TimeoutError'
          ? problem.message
          : 'We couldn’t confirm delivery. Your message is still here; please try again.',
      );
      setState('error');
    }
    requestAnimationFrame(() => status.current?.focus());
  }
  return (
    <div className="ct-contact-form">
      {state === 'sent' ? (
        <div
          ref={status}
          tabIndex={-1}
          className="ct-form-success"
          role="status"
        >
          <h2>
            Thanks for starting
            <br />
            the conversation.
          </h2>
          <p>Your message has been sent.</p>
          <button
            className="ct-button"
            onClick={() => {
              setState('idle');
              setErrors({});
              setFocused('Your details');
            }}
          >
            Send another message <Arrow />
          </button>
        </div>
      ) : (
        <form
          ref={form}
          onSubmit={submit}
          onFocusCapture={(event) => {
            const target = event.target;
            if (
              target instanceof HTMLInputElement ||
              target instanceof HTMLTextAreaElement
            )
              setFocused(
                target.name === 'topic'
                  ? 'What connects us'
                  : target.name === 'message'
                    ? 'Your conversation starts here'
                    : 'Your details',
              );
          }}
          action="/api/contact"
          method="post"
          aria-label="Contact Hirearchy"
        >
          <p className="ct-form-stage" aria-hidden="true">
            <span />
            {focused}
          </p>
          <h2>What’s on your mind?</h2>
          {[
            {
              name: 'name',
              label: 'Name',
              number: '01',
              type: 'text',
              autoComplete: 'name',
              max: 120,
              placeholder: 'How should we call you?',
            },
            {
              name: 'email',
              label: 'Email',
              number: '02',
              type: 'email',
              autoComplete: 'email',
              max: 254,
              placeholder: 'you@company.com',
            },
            {
              name: 'company',
              label: 'Company',
              number: '03',
              type: 'text',
              autoComplete: 'organization',
              max: 160,
              placeholder: 'Where you do your work',
            },
          ].map((field) => (
            <label
              className="ct-field"
              htmlFor={`contact-${field.name}`}
              key={field.name}
              data-number={field.number}
              data-invalid={Boolean(errors[field.name])}
            >
              <span className="ct-field-title">
                {field.label}
                {field.name === 'company' && <span> (optional)</span>}
              </span>
              <input
                id={`contact-${field.name}`}
                name={field.name}
                type={field.type}
                autoComplete={field.autoComplete}
                required={field.name !== 'company'}
                maxLength={field.max}
                placeholder={field.placeholder}
                aria-invalid={Boolean(errors[field.name])}
                aria-describedby={
                  errors[field.name] ? `error-${field.name}` : undefined
                }
                onBlur={(event) => {
                  if (event.target.value || errors[field.name])
                    validateField(event.target);
                }}
                onChange={(event) => {
                  if (errors[field.name]) validateField(event.target);
                }}
              />
              <span className="ct-field-underline" aria-hidden="true" />
              {errors[field.name] && (
                <span className="ct-field-error" id={`error-${field.name}`}>
                  {errors[field.name]}
                </span>
              )}
            </label>
          ))}
          <fieldset
            className="ct-topic-field"
            data-invalid={Boolean(errors.topic)}
            aria-describedby={errors.topic ? 'error-topic' : undefined}
          >
            <legend>
              04 <span>What would you like to talk about?</span>
            </legend>
            <div className="ct-topic-options">
              {[
                'Hirearchy Software',
                'Another discipline',
                'General question',
              ].map((topic, index) => (
                <label className="ct-topic-choice" key={topic}>
                  <input
                    type="radio"
                    name="topic"
                    value={topic}
                    id={`contact-topic-${index}`}
                    required
                    defaultChecked={initialTopic === topic}
                    onChange={(event) => validateField(event.target)}
                  />
                  <span>{topic}</span>
                </label>
              ))}
            </div>
            {errors.topic && (
              <p className="ct-field-error" id="error-topic">
                {errors.topic}
              </p>
            )}
          </fieldset>
          <label
            className="ct-field ct-field--message"
            htmlFor="contact-message"
            data-number="05"
            data-invalid={Boolean(errors.message)}
          >
            <span className="ct-field-title">Message</span>
            <textarea
              id="contact-message"
              name="message"
              required
              minLength={10}
              maxLength={5000}
              rows={4}
              placeholder="Tell us what you have in mind…"
              aria-invalid={Boolean(errors.message)}
              aria-describedby={`contact-note${errors.message ? ' error-message' : ''}`}
              onBlur={(event) => {
                if (event.target.value || errors.message)
                  validateField(event.target);
              }}
              onChange={(event) => {
                if (errors.message) validateField(event.target);
              }}
            />
            <span className="ct-field-underline" aria-hidden="true" />
            {errors.message && (
              <span className="ct-field-error" id="error-message">
                {errors.message}
              </span>
            )}
          </label>
          <p className="ct-form-note" id="contact-note">
            Please don’t include candidate records or sensitive personal
            information.
          </p>
          {state === 'error' && (
            <div
              className="ct-form-error"
              role="alert"
              tabIndex={-1}
              ref={status}
            >
              {error}
            </div>
          )}
          <button
            type="submit"
            className="ct-button"
            disabled={state === 'sending'}
          >
            {state === 'sending' ? 'Sending…' : 'Send message'}
            <Arrow />
          </button>
          <p className="ct-form-note" aria-live="polite">
            {state === 'sending'
              ? 'Sending your message. Please wait.'
              : 'We’ll use the details you provide to respond to your enquiry.'}
          </p>
        </form>
      )}
    </div>
  );
}
