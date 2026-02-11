# store-emails

A single Sanity project that stores form submissions from **any** project or site. Each submission is stored with fixed metadata (project, form id, date, URL) and a flexible JSON payload so different forms can have different fields without schema changes.

## What’s in this repo

- **Sanity Studio** – Manage and view all submissions in one place.
- **Form submission schema** – One document type: `formSubmission` (projectId, formId, submittedAt, sourceUrl, payload as JSON string).

There is **no API or Node server** in this repo. Each project that wants to store submissions configures its own Sanity client instance (pointing at this project) and creates `formSubmission` documents. The env (projectId, dataset, token) for this Sanity project is provided to each project.

## Studio

- **Develop:** `npm run dev`
- **Deploy:** `npm run deploy` (or `sanity deploy`)

## Storing submissions

**→ [Frontend integration guide](docs/frontend-email-integration.md)** – how to configure Sanity in your project and create `formSubmission` documents on form submit.

**Flow:**

1. You receive the **env** for this Sanity project: `SANITY_PROJECT_ID`, `SANITY_DATASET`, `SANITY_API_TOKEN` (token with write access; create at **Project → API → Tokens**).
2. In **each project** (Next.js, React, Vue, etc.) you add `@sanity/client`, configure it with that env, and on form submit create a document with `_type: 'formSubmission'` and the same fields (projectId, formId, submittedAt, sourceUrl, payload).
3. All submissions appear in this Studio and can be exported as JSON (GROQ, export API).

## Viewing and exporting submissions

- **Studio:** Open the “Form submission” type to list/filter by project, form, or date. Each document’s “Form data (JSON)” is the raw payload.
- **JSON export:** Use the [Sanity Export API](https://www.sanity.io/docs/exporting-data) or GROQ in [Vision](https://www.sanity.io/docs/the-vision-plugin) (e.g. `*[_type == "formSubmission"]`) to get all submissions as JSON.

## Summary

- One Sanity project, one schema: fixed metadata + one JSON payload field.
- No central API: each project configures Sanity client with the provided env and creates `formSubmission` docs.
- Different forms and projects can send different fields; no schema changes needed.
