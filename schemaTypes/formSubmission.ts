import { defineType, defineField } from 'sanity'
import { EnvelopeIcon } from '@sanity/icons'

export const formSubmission = defineType({
  name: 'formSubmission',
  title: 'Form submission',
  type: 'document',
  icon: EnvelopeIcon,
  fields: [
    defineField({
      name: 'projectId',
      title: 'Project ID',
      type: 'string',
      description: 'Identifier for the site/project this submission came from',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'formId',
      title: 'Form ID',
      type: 'string',
      description: 'Form identifier (e.g. contact, request-quote, newsletter)',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'submittedAt',
      title: 'Submitted at',
      type: 'datetime',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'sourceUrl',
      title: 'Source URL',
      type: 'string',
      description: 'Page URL where the form was submitted (optional)',
    }),
    defineField({
      name: 'payload',
      title: 'Form data (JSON)',
      type: 'text',
      description: 'Form fields as JSON. Structure varies per form.',
      validation: (rule) => rule.required(),
    }),
  ],
  orderings: [
    {
      title: 'Submitted at, newest first',
      name: 'submittedAtDesc',
      by: [{ field: 'submittedAt', direction: 'desc' }],
    },
    {
      title: 'Submitted at, oldest first',
      name: 'submittedAtAsc',
      by: [{ field: 'submittedAt', direction: 'asc' }],
    },
    {
      title: 'Project',
      name: 'projectIdAsc',
      by: [{ field: 'projectId', direction: 'asc' }],
    },
  ],
  preview: {
    select: {
      projectId: 'projectId',
      formId: 'formId',
      submittedAt: 'submittedAt',
    },
    prepare({ projectId, formId, submittedAt }) {
      const date = submittedAt
        ? new Date(submittedAt).toLocaleString(undefined, {
            dateStyle: 'short',
            timeStyle: 'short',
          })
        : 'No date'
      return {
        title: `${projectId} · ${formId}`,
        subtitle: date,
      }
    },
  },
})
