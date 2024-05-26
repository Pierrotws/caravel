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

import Gio from "gi://Gio";
import GLib from "gi://GLib";
import { BackgroundXml } from "../background.js";

const ByteArray = imports.byteArray;

const UNESCAPE = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&apos;": "'",
    "&quot;": '"'
};

export function listXmlFiles(directoryPath) {
    let xmlFilePaths = [];
    try {
        let dir = Gio.File.new_for_path(directoryPath);
        let enumerator = dir.enumerate_children(
            'standard::*',
            Gio.FileQueryInfoFlags.NONE,
            null
        );

        let fileInfo;
        while ((fileInfo = enumerator.next_file(null)) !== null) {
            let fileType = fileInfo.get_file_type();
            if (fileType === Gio.FileType.REGULAR) {
                let fileName = fileInfo.get_name();
                if (fileName.endsWith('.xml')) {
                    let file = enumerator.get_child(fileInfo);
                    xmlFilePaths.push(file.get_path());
                }
            }
        }
    } catch (e) {
        print('Error:', e.message);
    }
    return xmlFilePaths;
}

export function newBackgroundXmlFromFile(filepath) {
    let content = readXMLFile(filepath);
    //ignore metadata, get data only
    content = content.f;
    for (let i = 0; i < content.length; i++) {
        let child = content[i];
        //ignore anything else than "wallpapers" node
        if (child.n == "wallpapers") {
            //"wallpapers" node has one child only for now, the wallpaper
            return new BackgroundXml(filepath, child.f[0].f);
        }
    }
}


function readXMLFile(filePath) {
    // Open the file
    let xmlText = GLib.file_get_contents(filePath)[1];
    if (xmlText instanceof Uint8Array)
        xmlText = ByteArray.toString(xmlText);
    return parseXML(xmlText);
}

function parseXML(text) {
    const list = String.prototype.split.call(text, /<([^!<>?](?:'[\S\s]*?'|"[\S\s]*?"|[^'"<>])*|!(?:--[\S\s]*?--|\[[^\[\]'"<>]+\[[\S\s]*?]]|DOCTYPE[^\[<>]*?\[[\S\s]*?]|(?:ENTITY[^"<>]*?"[\S\s]*?")?[\S\s]*?)|\?[\S\s]*?\?)>/);
    const length = list.length;

    // root element
    const root = { f: [] };
    let elem = root;

    // dom tree stack
    const stack = [];

    for (let i = 0; i < length;) {
        // text node
        const str = list[i++];
        if (str) appendText(str);

        // child node
        const tag = list[i++];
        if (tag) parseNode(tag);
    }

    return root;

    function parseNode(tag) {
        const tagLength = tag.length;
        const firstChar = tag[0];
        if (firstChar === "/") {
            // close tag
            const closed = tag.replace(/^\/|[\s\/].*$/g, "").toLowerCase();
            while (stack.length) {
                const tagName = elem.n && elem.n.toLowerCase();
                elem = stack.pop();
                if (tagName === closed) break;
            }
        } else if (firstChar === "?") {
            // XML declaration
            appendChild({ n: "?", r: tag.substr(1, tagLength - 2) });
        } else if (firstChar === "!") {
            if (tag.substr(1, 7) === "[CDATA[" && tag.substr(-2) === "]]") {
                // CDATA section
                appendText(tag.substr(8, tagLength - 10));
            } else {
                // comment
                appendChild({ n: "!", r: tag.substr(1) });
            }
        } else {
            const child = openTag(tag);
            appendChild(child);
            if (tag[tagLength - 1] === "/") {
                child.c = 1; // emptyTag
            } else {
                stack.push(elem); // openTag
                elem = child;
            }
        }
    }

    function appendChild(child) {
        elem.f.push(child);
    }

    function appendText(str) {
        str = removeSpaces(str);
        if (str) appendChild(unescapeXML(str));
    }
}

function openTag(tag) {
    const elem = { f: [] };
    tag = tag.replace(/\s*\/?$/, "");
    const pos = tag.search(/[\s='"\/]/);
    if (pos < 0) {
        elem.n = tag;
    } else {
        elem.n = tag.substr(0, pos);
        elem.t = tag.substr(pos);
    }
    return elem;
}


function removeSpaces(str) {
    return str && str.replace(/^\s+|\s+$/g, "");
}

function unescapeXML(str) {
    return str.replace(/(&(?:lt|gt|amp|apos|quot|#(?:\d{1,6}|x[0-9a-fA-F]{1,5}));)/g, function (str) {
        if (str[1] === "#") {
            const code = (str[2] === "x") ? parseInt(str.substr(3), 16) : parseInt(str.substr(2), 10);
            if (code > -1) return String.fromCharCode(code);
        }
        return UNESCAPE[str] || str;
    });
}
