import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {schemaTypes} from './schemaTypes'

export default defineConfig({
  name: 'moinander',
  title: 'Moinander Redaktion',
  projectId: 'nqq96vbs',
  dataset: 'production',
  plugins: [structureTool()],
  schema: {types: schemaTypes},
})
