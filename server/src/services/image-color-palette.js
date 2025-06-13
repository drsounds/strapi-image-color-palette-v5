/**
 * MIT License

Copyright (c) 2023 Studio123
Copyright (c) 2025 Alexander Forselius

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

 */
'use strict';

import env from 'env-var';
import axios from 'axios';
import gmPalette from 'gm-palette';
import getSvgColors from 'get-svg-colors';
import { ColorTranslator } from 'colortranslator';
import { getService } from '../utils';

const convert = (rgbObj, format) => {
    if (!rgbObj) return null;

    const color = new ColorTranslator(rgbObj);

    switch (format) {
        case 'hex':
            return color.HEX;
        case 'rgb':
            return color.RGB;
        case 'hsl':
            return color.HSL;
        case 'raw':
            return rgbObj;
        default:
            return rgbObj;
    }
};

export default ({ strapi }) => ({
    async generate(url, mime) {
        try {
            const settings = getService(strapi, 'settings').get();

            let imageUrl = url;
            let dominantColor = null;
            let palette = [];

            // if url is relative, add host
            if (!url.startsWith('http')) {
                let host = env.get('HOST').asString();
                let port = env.get('PORT').asInt();

                imageUrl = `http://${host}:${port}${url}`;
            }

            if (mime === 'image/svg+xml') {
                // get svg as a string
                const res = await axios.get(imageUrl, {
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                    },
                });
                const svg = res.data;
                const svgColors = await getSvgColors(svg);

                const { fills, strokes, stops } = svgColors;

                palette = [...fills, ...strokes, ...stops];

                if (palette.length > 0) {
                    // format colors to rgb object
                    palette = palette.map(color => {
                        let rgbObj = {
                            r: color._rgb[0],
                            g: color._rgb[1],
                            b: color._rgb[2],
                        };

                        return rgbObj;
                    });

                    // remove duplicates from palette
                    palette = palette.filter((color, index, self) => {
                        return (
                            index ===
                            self.findIndex(
                                c => c.r === color.r && c.g === color.g && c.b === color.b,
                            )
                        );
                    });

                    dominantColor = palette[0];
                }
            } else {
                const res = await axios.get(imageUrl, {
                    responseType: 'arraybuffer',
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                    },
                });

                if (!res.data) return null;

                dominantColor = await gmPalette.dominantColor(res.data);
                palette = await gmPalette.palette(res.data, settings.paletteSize || 4);
            }

            let colors = {
                dominant: convert(dominantColor, settings.format),
                palette: palette.map(color => convert(color, settings.format)),
            };

            return colors;
        } catch (e) {
            strapi.log.error(e);
            return null;
        }
    },
});
