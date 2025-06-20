'use strict';

import yup from 'yup';

export default yup.object().shape({
    format: yup.string().oneOf(['hex', 'rgb']),
    paletteSize: yup.number().min(1).max(8),
});
