import {defineField, defineType} from 'sanity'

const richText = [
  {type: 'block' as const},
]

const project = defineType({
  name: 'project', title: 'Projekte & Beiträge', type: 'document',
  fields: [
    defineField({name: 'title', title: 'Titel', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'slug', title: 'Webadresse', type: 'slug', options: {source: 'title'}, validation: (rule) => rule.required()}),
    defineField({name: 'kind', title: 'Art des Beitrags', type: 'string', options: {list: [
      {title: 'Förderprojekt', value: 'Förderprojekt'},
      {title: 'Schule & Jugend', value: 'Schule & Jugend'},
      {title: 'Aus der Region', value: 'Aus der Region'},
      {title: 'Vereinsprojekt', value: 'Vereinsprojekt'},
    ]}}),
    defineField({name: 'summary', title: 'Kurzbeschreibung', type: 'text', rows: 3, validation: (rule) => rule.required().max(300)}),
    defineField({name: 'image', title: 'Titelbild', type: 'image', options: {hotspot: true}, fields: [defineField({name: 'alt', title: 'Bildbeschreibung', type: 'string'})]}),
    defineField({name: 'body', title: 'Beitrag', type: 'array', of: richText}),
    defineField({name: 'publishedAt', title: 'Veröffentlichungsdatum', type: 'datetime'}),
    defineField({name: 'featuredOnHome', title: 'Auf der Startseite zeigen', type: 'boolean', initialValue: false}),
    defineField({name: 'homeOrder', title: 'Reihenfolge auf der Startseite', type: 'number', hidden: ({document}) => !document?.featuredOnHome, validation: (rule) => rule.min(1).max(3)}),
  ],
  preview: {select: {title: 'title', subtitle: 'kind', media: 'image'}},
})

const event = defineType({
  name: 'event', title: 'Termine', type: 'document',
  fields: [
    defineField({name: 'title', title: 'Titel', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'startsAt', title: 'Beginn', type: 'datetime', validation: (rule) => rule.required()}),
    defineField({name: 'endsAt', title: 'Ende', type: 'datetime'}),
    defineField({name: 'location', title: 'Ort', type: 'string'}),
    defineField({name: 'summary', title: 'Kurzbeschreibung', type: 'text', rows: 3, validation: (rule) => rule.required().max(300)}),
    defineField({name: 'description', title: 'Weitere Informationen', type: 'array', of: richText}),
    defineField({name: 'link', title: 'Weiterführender Link', type: 'url'}),
  ],
  preview: {select: {title: 'title', subtitle: 'startsAt'}},
})

const partner = defineType({
  name: 'partner', title: 'Partner & Sponsoren', type: 'document',
  fields: [
    defineField({name: 'name', title: 'Name', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'kind', title: 'Art', type: 'string', options: {list: [
      {title: 'Partner', value: 'Partner'}, {title: 'Sponsor', value: 'Sponsor'},
    ]}, validation: (rule) => rule.required()}),
    defineField({name: 'logo', title: 'Logo', type: 'image', fields: [defineField({name: 'alt', title: 'Bildbeschreibung', type: 'string'})]}),
    defineField({name: 'summary', title: 'Beschreibung', type: 'text', rows: 3}),
    defineField({name: 'website', title: 'Webseite', type: 'url'}),
    defineField({name: 'sortOrder', title: 'Reihenfolge', type: 'number'}),
  ],
  preview: {select: {title: 'name', subtitle: 'kind', media: 'logo'}},
})

const boardMember = defineType({
  name: 'boardMember', title: 'Vorstand', type: 'document',
  fields: [
    defineField({name: 'name', title: 'Name', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'role', title: 'Amt', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'portrait', title: 'Porträt', type: 'image', options: {hotspot: true}, fields: [defineField({name: 'alt', title: 'Bildbeschreibung', type: 'string'})]}),
    defineField({name: 'sortOrder', title: 'Reihenfolge', type: 'number'}),
  ],
  preview: {select: {title: 'name', subtitle: 'role', media: 'portrait'}},
})

export const schemaTypes = [project, event, partner, boardMember]
