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

import Cairo from 'gi://cairo';
import Gdk from 'gi://Gdk';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

import { EXTENSION_UUID, DELAY_MINUTES_MIN, DELAY_MINUTES_MAX } from './define.js';

const ByteArray = imports.byteArray;
const UNESCAPE = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&apos;": "'",
    "&quot;": '"'
};

export function Me() {
    let self = Me;
    if (self._me == null) {
        self._me = Extension.lookupByUUID(EXTENSION_UUID);
    }
    return self._me;
}

export function valid_minutes(minutes) {
    return minutes >= DELAY_MINUTES_MIN && minutes <= DELAY_MINUTES_MAX;
}

/**
 * Generate a merged image from 2 image
 * @param left to use. only half left will be used.
 * @param right to use. only half right will be used.
 * @throws Error if dimensions of images in parameters differ
 */
export function mergeImage(left, right) {
    // Ensure both images are the same size
    if (left.get_width() !== right.get_width() || left.get_height() !== right.get_height()) {
        throw new Error("Images must have the same dimensions");
    }
    let width = left.get_width();
    let height = left.get_height();
    // Create a new surface to draw the merged image
    let surface = new Cairo.ImageSurface(Cairo.Format.ARGB32, width, height);
    let context = new Cairo.Context(surface);

    Gdk.cairo_set_source_pixbuf(context, left, 0, 0);
    // Draw the left half of image1
    context.rectangle(0, 0, width / 2, height);
    context.fill();
    // Draw the right half of image2
    Gdk.cairo_set_source_pixbuf(context, right, 0, 0);
    context.rectangle(width / 2, 0, width / 2, height);
    context.fill();
    // Paint the context onto the surface
    //cr.paint();
    return Gdk.pixbuf_get_from_surface(surface, 0, 0, width, height);
}

export function readXMLFile(filePath) {
    // Open the file
    let xmlText = GLib.file_get_contents(filePath)[1];
    if (xmlText instanceof Uint8Array)
        xmlText = ByteArray.toString(xmlText);    
    return parseXML(xmlText);
}

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


function parseXML(text) {
    const list = String.prototype.split.call(text, /<([^!<>?](?:'[\S\s]*?'|"[\S\s]*?"|[^'"<>])*|!(?:--[\S\s]*?--|\[[^\[\]'"<>]+\[[\S\s]*?]]|DOCTYPE[^\[<>]*?\[[\S\s]*?]|(?:ENTITY[^"<>]*?"[\S\s]*?")?[\S\s]*?)|\?[\S\s]*?\?)>/);
    const length = list.length;

    // root element
    const root = {f: []};
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
            appendChild({n: "?", r: tag.substr(1, tagLength - 2)});
        } else if (firstChar === "!") {
            if (tag.substr(1, 7) === "[CDATA[" && tag.substr(-2) === "]]") {
                // CDATA section
                appendText(tag.substr(8, tagLength - 10));
            } else {
                // comment
                appendChild({n: "!", r: tag.substr(1)});
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
    const elem = {f: []};
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
    return str.replace(/(&(?:lt|gt|amp|apos|quot|#(?:\d{1,6}|x[0-9a-fA-F]{1,5}));)/g, function(str) {
        if (str[1] === "#") {
            const code = (str[2] === "x") ? parseInt(str.substr(3), 16) : parseInt(str.substr(2), 10);
            if (code > -1) return String.fromCharCode(code);
        }
        return UNESCAPE[str] || str;
    });
}
