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
    BG_XML_OPTIONS,
    BG_XML_PCOLOR, 
    BG_XML_SCOLOR,
    BG_XML_SHADE_TYPE,
    BG_XML_WALLPAPER,
    BG_XML_WALLPAPER_DARK
} from "./define.js";

import { readXMLFile } from "./utils.js";

function parseXMLWp(filepath, entries){
    let wp = new BackgroundXml(filepath);
    for(let i=0; i<entries.length; i++) {
        if(entries[i].n == "name"){
            wp.name = entries[i].f[0];
        }
        else if (entries[i].n == BG_XML_WALLPAPER){
            wp.wallpaper = entries[i].f[0];
        }
        else if (entries[i].n == BG_XML_WALLPAPER_DARK){
            wp.wallpaper_dark = entries[i].f[0];
        }
        else if (entries[i].n == BG_XML_OPTIONS){
            wp.options = entries[i].f[0];
        }
        else if (entries[i].n == BG_XML_SHADE_TYPE){
            wp.shade_type = entries[i].f[0];
        }
        else if (entries[i].n == BG_XML_PCOLOR){
            wp.pcolor = entries[i].f[0];
        }
        else if (entries[i].n == BG_XML_SCOLOR){
            wp.scolor = entries[i].f[0];
        }
    }
    return wp;
}

export function createFromXML(filepath) {
    let content = readXMLFile(filepath);
    //ignore metadata, get data only
    content = content.f
    for(let i=0; i< content.length; i++){
        let child = content[i];
        //ignore anything else than "wallpapers" node
        if(child.n == "wallpapers") {
            //"wallpapers" node has one child only for now, the wallpaper
            return parseXMLWp(filepath, child.f[0].f);
        }
    }
}

export class BackgroundXml {
    constructor(filepath){
        this.filepath = filepath;
    }
}
