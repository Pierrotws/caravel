/* 
 * Copyright (C) 2024 Pierre Sauvage
 *
 * This file is part of Caravel.
 *
 * Caravel free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Caravel distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Caravel. If not, see <http://www.gnu.org/licenses/>.
*/

import {
    BG_XML_NAME,
    BG_XML_OPTIONS,
    BG_XML_PCOLOR, 
    BG_XML_SCOLOR,
    BG_XML_SHADE_TYPE,
    BG_XML_WALLPAPER,
    BG_XML_WALLPAPER_DARK
} from "./define.js";

export class BackgroundXml {

    /**
     * Create new instance of BackgroundXml
     * @param filepath filepath of background-properties file
     * @param xmlContent Parsed XML content of file 
     */
    constructor(filepath, xmlContent){
        this.filepath = filepath;
        for(let i=0; i<xmlContent.length; i++) {
            switch(xmlContent[i].n) {
                case BG_XML_NAME:
                    this.name = xmlContent[i].f[0];
                    break;
                case BG_XML_WALLPAPER:
                    this.wallpaper = xmlContent[i].f[0];
                    break;
                case BG_XML_WALLPAPER_DARK:
                    this.wallpaper_dark = xmlContent[i].f[0];
                    break;
                case BG_XML_OPTIONS:
                    this.options = xmlContent[i].f[0];
                    break;
                case BG_XML_SHADE_TYPE:
                    this.shade_type = xmlContent[i].f[0];
                    break;
                case BG_XML_PCOLOR:
                    this.pcolor = xmlContent[i].f[0];
                    break;
                case BG_XML_SCOLOR:
                    this.scolor = xmlContent[i].f[0];
                    break;
            }
        }
    }
}
