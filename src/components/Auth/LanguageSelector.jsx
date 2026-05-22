/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

import{useTranslation}from'react-i18next';
import{Button,Box}from'@mui/material';

const rtlLangs = new Set(['ar','he']);

const LanguageSelector = () => {
    const{i18n}=useTranslation();

    const supportedLanguages = [
        {code:'en',label:'EN'},
        {code:'es',label:'ES'},
        {code:'ar',label:'AR'},
        {code:'de',label:'DE'},
        {code:'fr',label:'FR'},
        {code:'it',label:'IT'},
        {code:'ja',label:'JA'},
        {code:'ru',label:'RU'},
        {code:'zh',label:'ZH'},
        {code:'pt',label:'PT'},
        {code:'hi',label:'HI'},
        {code:'he',label:'HE'}
    ];

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
        const newDirection = rtlLangs.has(lng)?'rtl':'ltr';
        document.documentElement.setAttribute('dir',newDirection);
    };

    const currentDirection = rtlLangs.has(i18n.language)?'rtl':'ltr';

    return (
        <Box
            dir={currentDirection}
            sx={{textAlign:currentDirection === 'rtl'?'left':'right',p:2}}
        >
            {supportedLanguages.map((lang) => (
                <Button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    variant={i18n.language === lang.code?'contained':'outlined'}
                    size="small"
                    sx={{
                        [currentDirection === 'rtl'?'ml':'mr']:1,
                        [currentDirection === 'rtl'?'mr':'ml']:0,
                    }}
                >
                    {lang.label}
                </Button>
            ))}
        </Box>
    );
};

export default LanguageSelector;