import type { Core } from '@strapi/strapi';

import { getService, canGenerateColor } from './utils';

const bootstrap = ({ strapi }: { strapi: Core.Strapi }) => {
  const generateColorPalette = async event => {
    const { data } = event.params;

    if (!canGenerateColor(data)) return;

    data.colors = await getService(strapi, 'image-color-palette').generate(data.url, data.mime);
  };

  strapi.db.lifecycles.subscribe({
    models: ['plugin::upload.file'],
    beforeCreate: generateColorPalette,
    beforeUpdate: generateColorPalette,
  });
};

export default bootstrap;
