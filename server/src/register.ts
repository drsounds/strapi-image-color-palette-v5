import type { Core } from '@strapi/strapi';

import gm from 'gm'
const path = require('path')

const register = ({ strapi }: { strapi: Core.Strapi }) => {
    if (!strapi.plugin('upload'))
        return strapi.log.warn(
            'Upload plugin is not installed, skipping image color palette plugin.',
        );

    // Check if GraphicsMagick is installed (use ./server/assets/test.png)
    gm(path.join(__dirname, 'assets', 'test.png')).identify((err, data) => {
        if (err) {
            return strapi.log.warn(
                'GraphicsMagick is not installed or is misconfigured, skipping image color palette plugin.',
            );
        }
    });

    // Add the colors attribute to the file content type
    strapi.plugin('upload').contentTypes.file.schema.attributes.colors = {
        type: 'json',
    };
};

export default register;
