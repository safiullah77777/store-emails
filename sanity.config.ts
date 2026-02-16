import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'store-emails',

  projectId: process.env.SANITY_STUDIO_API_PROJECT_ID || 'hidec648',
  dataset: process.env.SANITY_STUDIO_API_DATASET || 'development',

  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },
})
