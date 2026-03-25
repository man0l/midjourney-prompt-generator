import { writeFileSync } from 'fs';
import { join } from 'path';

const optionTypes = [
  {
    name: 'style-option',
    displayName: 'Style Option',
    singularName: 'Style Option',
    fields: [
      { name: 'name', type: 'string', required: true },
      { name: 'description', type: 'text' },
      { name: 'promptAddition', type: 'text', required: true },
      { name: 'imageUrl', type: 'media', multiple: false, required: true, allowedTypes: ['images'] },
      { name: 'tags', type: 'json', default: '[]' }
    ]
  },
  {
    name: 'lighting-option',
    displayName: 'Lighting Option',
    singularName: 'Lighting Option',
    fields: [
      { name: 'name', type: 'string', required: true },
      { name: 'description', type: 'text' },
      { name: 'promptAddition', type: 'text', required: true },
      { name: 'imageUrl', type: 'media', multiple: false, required: true, allowedTypes: ['images'] },
      { name: 'tags', type: 'json', default: '[]' }
    ]
  },
  {
    name: 'camera-option',
    displayName: 'Camera Option',
    singularName: 'Camera Option',
    fields: [
      { name: 'name', type: 'string', required: true },
      { name: 'description', type: 'text' },
      { name: 'promptAddition', type: 'text', required: true },
      { name: 'imageUrl', type: 'media', multiple: false, required: true, allowedTypes: ['images'] },
      { name: 'tags', type: 'json', default: '[]' }
    ]
  },
  {
    name: 'color-option',
    displayName: 'Color Option',
    singularName: 'Color Option',
    fields: [
      { name: 'name', type: 'string', required: true },
      { name: 'description', type: 'text' },
      { name: 'promptAddition', type: 'text', required: true },
      { name: 'imageUrl', type: 'media', multiple: false, required: true, allowedTypes: ['images'] },
      { name: 'tags', type: 'json', default: '[]' }
    ]
  },
  {
    name: 'material-option',
    displayName: 'Material Option',
    singularName: 'Material Option',
    fields: [
      { name: 'name', type: 'string', required: true },
      { name: 'description', type: 'text' },
      { name: 'promptAddition', type: 'text', required: true },
      { name: 'imageUrl', type: 'media', multiple: false, required: true, allowedTypes: ['images'] },
      { name: 'tags', type: 'json', default: '[]' }
    ]
  },
  {
    name: 'artist-option',
    displayName: 'Artist Option',
    singularName: 'Artist Option',
    fields: [
      { name: 'name', type: 'string', required: true },
      { name: 'description', type: 'text' },
      { name: 'promptAddition', type: 'text', required: true },
      { name: 'imageUrl', type: 'media', multiple: false, required: true, allowedTypes: ['images'] },
      { name: 'tags', type: 'json', default: '[]' }
    ]
  }
];

const basePath = '/home/manol/Projects/personal/midjourney-prompt-generator/content-api/src/api';

optionTypes.forEach(type => {
  const schema = {
    kind: 'collectionType',
    collectionName: `${type.name.replace('-', '_')}s`,
    info: {
      displayName: type.displayName,
      singularName: type.singularName
    },
    attributes: {}
  };

  type.fields.forEach(field => {
    const attr = {};
    attr[field.name] = {};
    
    if (field.type) attr[field.name].type = field.type;
    if (field.required) attr[field.name].required = field.required;
    if (field.maxLength) attr[field.name].maxLength = field.maxLength;
    if (field.multiple !== undefined) attr[field.name].multiple = field.multiple;
    if (field.allowedTypes) attr[field.name].allowedTypes = field.allowedTypes;
    if (field.default !== undefined) attr[field.name].default = field.default;
    if (field.targetField) attr[field.name].targetField = field.targetField;
    if (field.unique !== undefined) attr[field.name].unique = field.unique;

    schema.attributes[field.name] = attr[field.name];
  });

  const schemaPath = join(basePath, type.name, 'content-types', type.name, 'schema.json');
  writeFileSync(schemaPath, JSON.stringify(schema, null, 2));
  console.log(`✅ Created schema for ${type.displayName}`);
});

console.log('\n✨ All option schemas created!');