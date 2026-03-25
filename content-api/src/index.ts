import type { Core } from '@strapi/strapi';

const PUBLIC_CONTENT_TYPES = [
  'api::post.post',
  'api::style-option.style-option',
  'api::lighting-option.lighting-option',
  'api::camera-option.camera-option',
  'api::color-option.color-option',
  'api::material-option.material-option',
  'api::artist-option.artist-option',
];

export default {
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    // Grant public read access to all content types
    const publicRole = await strapi
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: 'public' } });

    if (!publicRole) return;

    for (const uid of PUBLIC_CONTENT_TYPES) {
      for (const action of ['find', 'findOne']) {
        const permKey = `${uid}.${action}`;
        const existing = await strapi
          .query('plugin::users-permissions.permission')
          .findOne({ where: { action: permKey, role: publicRole.id } });

        if (!existing) {
          await strapi.query('plugin::users-permissions.permission').create({
            data: { action: permKey, role: publicRole.id, enabled: true },
          });
        } else if (!existing.enabled) {
          await strapi
            .query('plugin::users-permissions.permission')
            .update({ where: { id: existing.id }, data: { enabled: true } });
        }
      }
    }
  },
};
