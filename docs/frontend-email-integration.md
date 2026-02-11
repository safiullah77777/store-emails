# Frontend integration: store form submissions in store-emails

Each project configures its own **Sanity client** pointing at the store-emails project and creates a `formSubmission` document on form submit. There is no central API to call; env is provided to your project and you create the doc from your app (usually via a server/API route so the token is not in the browser).

---

## 1. Prerequisites

- **Env for the store-emails Sanity project** is provided to your project:
  - `SANITY_PROJECT_ID` – store-emails project id
  - `SANITY_DATASET` – e.g. `production`
  - `SANITY_API_TOKEN` – token with **Editor** (write) access
- Choose a **projectId** (identifier for your app/site, e.g. `my-website`) and **formId** (e.g. `contact`, `newsletter`) for each form.

---

## 2. Document shape (formSubmission)

Each submission is one document with:

| Field         | Type   | Required | Description |
|---------------|--------|----------|-------------|
| `projectId`   | string | Yes      | Your app/site identifier (e.g. `my-website`). |
| `formId`      | string | Yes      | Form name (e.g. `contact`, `newsletter`). |
| `submittedAt` | string | Yes      | ISO datetime (e.g. `new Date().toISOString()`). |
| `sourceUrl`   | string | No       | Page URL where the form was submitted. |
| `payload`     | string | Yes      | Form data as **stringified JSON** (any shape). |

---

## 3. Install and configure Sanity in your project

Install the client:

```bash
npm install @sanity/client
```

Create a Sanity client that writes to the store-emails project. **Prefer doing this on the server** (API route, server action, backend) so the token is not exposed to the browser.

**Example – shared client module (use on server only):**

```js
// lib/sanity-store.js or similar (Node / server only)
import { createClient } from '@sanity/client'

export const storeEmailsClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
})
```

Add to your `.env` / `.env.local` (values provided to you for the store-emails project):

```env
SANITY_PROJECT_ID=your_store_emails_project_id
SANITY_DATASET=production
SANITY_API_TOKEN=your_write_token
```

---

## 4. Create a formSubmission on submit

Call the client’s `create` with one document. Use your chosen `projectId` and `formId`; pass form data as stringified JSON in `payload`.

```js
import { storeEmailsClient } from './lib/sanity-store'

const PROJECT_ID = 'my-website' // your app identifier
const FORM_ID = 'contact'

async function saveSubmissionToStore(formData, sourceUrl = '') {
  await storeEmailsClient.create({
    _type: 'formSubmission',
    projectId: PROJECT_ID,
    formId: FORM_ID,
    submittedAt: new Date().toISOString(),
    sourceUrl: sourceUrl || undefined,
    payload: JSON.stringify(formData),
  })
}
```

Use this from your form handler (e.g. after sending email or in parallel).

---

## 5. Integration examples

### 5.1 Next.js (App Router) – API route + client

Keep the token on the server: form submits to your API route; the route uses the Sanity client.

**`lib/sanity-store.js`** (server):

```js
import { createClient } from '@sanity/client'

export const storeEmailsClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
})
```

**`app/api/submit-form/route.js`** (or `.ts`):

```js
import { storeEmailsClient } from '@/lib/sanity-store'
import { NextResponse } from 'next/server'

export async function POST(request) {
  const body = await request.json()
  const { projectId, formId, payload, sourceUrl } = body

  if (!projectId || !formId) {
    return NextResponse.json(
      { error: 'Missing projectId or formId' },
      { status: 400 }
    )
  }

  try {
    const doc = await storeEmailsClient.create({
      _type: 'formSubmission',
      projectId,
      formId,
      submittedAt: new Date().toISOString(),
      sourceUrl: sourceUrl || undefined,
      payload: typeof payload === 'string' ? payload : JSON.stringify(payload ?? {}),
    })
    return NextResponse.json({ ok: true, id: doc._id }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

**Frontend** – call your own API:

```js
const res = await fetch('/api/submit-form', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    projectId: 'my-website',
    formId: 'contact',
    sourceUrl: typeof window !== 'undefined' ? window.location.href : '',
    payload: { name, email, message },
  }),
})
if (!res.ok) throw new Error(await res.text())
```

---

### 5.2 React – form that posts to your API route

Same as above: your React app only talks to your backend; the backend uses the Sanity client and env.

```jsx
function ContactForm() {
  const [status, setStatus] = useState('idle')
  const [formData, setFormData] = useState({ name: '', email: '', message: '' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/submit-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: 'my-website',
          formId: 'contact',
          sourceUrl: window.location.href,
          payload: formData,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      setStatus('success')
      setFormData({ name: '', email: '', message: '' })
    } catch (err) {
      console.error(err)
      setStatus('error')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="Name" required />
      <input type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} placeholder="Email" required />
      <textarea value={formData.message} onChange={e => setFormData(p => ({ ...p, message: e.target.value }))} placeholder="Message" required />
      <button type="submit" disabled={status === 'loading'}>
        {status === 'loading' ? 'Sending…' : 'Send'}
      </button>
      {status === 'success' && <p>Thank you!</p>}
      {status === 'error' && <p>Something went wrong.</p>}
    </form>
  )
}
```

---

### 5.3 Vue 3 – form that posts to your API route

Your Vue app calls your own backend; the backend holds the Sanity client and env.

```vue
<script setup>
import { ref } from 'vue'

const status = ref('idle')
const form = ref({ name: '', email: '', message: '' })

async function onSubmit() {
  status.value = 'loading'
  try {
    const res = await fetch('/api/submit-form', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: 'my-website',
        formId: 'contact',
        sourceUrl: window.location.href,
        payload: form.value,
      }),
    })
    if (!res.ok) throw new Error(await res.text())
    status.value = 'success'
    form.value = { name: '', email: '', message: '' }
  } catch (e) {
    console.error(e)
    status.value = 'error'
  }
}
</script>

<template>
  <form @submit.prevent="onSubmit">
    <input v-model="form.name" placeholder="Name" required />
    <input v-model="form.email" type="email" placeholder="Email" required />
    <textarea v-model="form.message" placeholder="Message" required />
    <button type="submit" :disabled="status === 'loading'">
      {{ status === 'loading' ? 'Sending…' : 'Send' }}
    </button>
    <p v-if="status === 'success'">Thank you!</p>
    <p v-else-if="status === 'error'">Something went wrong.</p>
  </form>
</template>
```

---

### 5.4 Plain HTML form + backend

The form can POST to your own endpoint (e.g. Next.js API route, Express, serverless). That endpoint uses the Sanity client (with env) and creates the `formSubmission` document as in section 4. The frontend only needs to submit to your URL; no Sanity code in the browser.

---

## 6. Using with your existing “send email” flow

Run both in the same submit handler (e.g. in your API route):

```js
// In your API route or server action
await Promise.all([
  sendEmail(formData), // your existing email logic
  storeEmailsClient.create({
    _type: 'formSubmission',
    projectId: 'my-website',
    formId: 'contact',
    submittedAt: new Date().toISOString(),
    sourceUrl: sourceUrl || undefined,
    payload: JSON.stringify(formData),
  }),
])
```

Or create the Sanity doc after a successful email send.

---

## 7. Different forms on the same site

Use the same `projectId` for the whole site and different `formId` values:

- Contact: `formId: 'contact'`, `payload: { name, email, message }`
- Newsletter: `formId: 'newsletter'`, `payload: { email }`
- Quote: `formId: 'request-quote'`, `payload: { company, email, service, budget }`

No schema changes; each form’s payload can have a different shape.

---

## 8. Security note

- **Do not** put `SANITY_API_TOKEN` in client-side code or in env vars that are exposed to the browser (e.g. `NEXT_PUBLIC_*`, `VITE_*`). Anyone could then write to your dataset.
- Use the token only on the server: API routes, server actions, or another backend that your frontend calls. The examples above use a `/api/submit-form` (or similar) route for that reason.

---

## Quick checklist

1. Get env for store-emails: `SANITY_PROJECT_ID`, `SANITY_DATASET`, `SANITY_API_TOKEN`.
2. In your project: add `@sanity/client`, create a client with that env (server-only).
3. On form submit (server-side): call `client.create({ _type: 'formSubmission', projectId, formId, submittedAt, sourceUrl, payload: JSON.stringify(formData) })`.
4. Optionally run your existing email (or other) flow in parallel or after the create.
5. View and export submissions in the store-emails Studio.
