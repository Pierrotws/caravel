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

import { readXMLFile } from "./utils.js";

function parseXMLWp(entries){
    let wp = new BackgroundXml();
    for(let i=0; i<entries.length; i++) {
        if(entries[i].n == "name"){
            wp.name = entries[i].f[0];
        }
        else if (entries[i].n == "filename"){
            wp.filename_light = entries[i].f[0];
        }
        else if (entries[i].n == "filename-dark"){
            wp.filename_dark = entries[i].f[0];
        }
        else if (entries[i].n == "options"){
            wp.options = entries[i].f[0];
        }
        else if (entries[i].n == "shade_type"){
            wp.shade_type = entries[i].f[0];
        }
        else if (entries[i].n == "pcolor"){
            wp.pcolor = entries[i].f[0];
        }
        else if (entries[i].n == "scolor"){
            wp.scolor = entries[i].f[0];
        }
    }
    return wp;
}

function parseXMLRoot(xmlParsed){
    let content = xmlParsed.f;
    for(let i=0; i< content.length; i++){
        let child = content[i];
        if(child.n == "wallpapers") {
            return parseXMLWp(child.f[0].f);
        }
    }
}

export function createFromXML(filePath) {
    let content = readXMLFile(filePath);
    return parseXMLRoot(content);
}

export class BackgroundXml {
    constructor(){
        this.name = null;
        this.filename_light = null;
        this.filename_dark = null;
        this.options = null;
        this.shade_type = null;
        this.pcolor = null;
        this.scolor = null;
    }
}
