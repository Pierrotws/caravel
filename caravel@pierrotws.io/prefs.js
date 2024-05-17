/* 
 * Copyright (C) 2024 Pierre Sauvage
 * Copyright (C) 2012 Lukas Knuth
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

/**
 * Preferences for the extension which will be available in the "gnome-shell-extension-prefs"
 *  tool.
 * In the preferences, you can add new images to the list and remove old ones.
 * @see <a href="https://live.gnome.org/GnomeShell/Extensions#Extension_Preferences">Doc</a>
 */

import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gdk from 'gi://Gdk';
import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import GdkPixbuf from 'gi://GdkPixbuf';


import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import * as Pref from './settings.js';
import { EXTENSION_UUID } from './utils.js';

export default class CaravelExtensionPreferences extends ExtensionPreferences {
    _init(extension) {
        console.log("Caravel Preferences class init");

        extension.initTranslations();
        settings = new Pref.Settings(extension)
        this._initialized = true;
    }

    fillPreferencesWindow(window) {
        let page = new Adw.PreferencesPage({title: 'Caravel Settings'});
        let prefGroup = new Adw.PreferencesGroup({title: 'Select Images'});
        let optRow = new Adw.ActionRow({title: ''});
        window.add(page);
        page.add(prefGroup);
        prefGroup.add(optRow);

        optRow.add_suffix(this.getPreferencesWidget());
    }

    getPreferencesWidget() {
        if (!this._initialized) {
            this._init(ExtensionPreferences.lookupByUUID(EXTENSION_UUID));
        }
        return buildPrefsWidget();
    }
}


let settings;
let ready = false;
const IMAGE_REGEX = /^image\/\w+$/i;
const PIXBUF_COL = 0;
const PATH_COL = 1;

/**
 * Called right after the file was loaded.
 */
function init(){
    console.log("Caravel Preferences static init");
    let extension = Me();
    extension.initTranslations();
    settings = new Pref.Settings(extension)
}

function addFileEntry(model, path){
    // Asynchronously load and scale the image from the given path:
    try {
        let file = Gio.file_new_for_path(path);
        let stream = file.read(null);
        /*
            We need to assign the new "space" in the grid outside, to keep the order
            of the list. Otherwise, we get the order in which the loading finishes...
        */
        let iterator = model.append();
        // Load it Async:
        GdkPixbuf.Pixbuf.new_from_stream_at_scale_async(stream, 240, -1, true, null,
            function(source, res){                   // TODO Max-Height...!
                // Get the loaded image:
                let image = GdkPixbuf.Pixbuf.new_from_stream_finish(res);
                if (image === undefined) return;
                // Append to the list:
                model.set(iterator, [PIXBUF_COL,PATH_COL], [image, path]);
                // There is data in the list, we're ready to store if necessary:
                ready = true;
            });
    } catch (e){
        // Image could not be loaded. Invalid path.
        /*
            It's okay to do nothing here, when the list is stored, the invalid image will not be
            stored with the rest, so it's practically gone.
        */
        print(e);
    }
}

function addDirectory(model, path){
    let dir = Gio.file_new_for_path(path);
    if (dir.query_file_type(Gio.FileQueryInfoFlags.NONE, null) != Gio.FileType.DIRECTORY){
        // Not a valid directory!
        return;
    }
    // List all children:
    let children = dir.enumerate_children("*", Gio.FileQueryInfoFlags.NOFOLLOW_SYMLINKS, null);
    let info;
    while ( (info = children.next_file(null)) != null){
        if (info.get_file_type() == Gio.FileType.REGULAR && info.get_is_hidden() == false){
            // Check if it's an image:
            if (info.get_content_type().match(IMAGE_REGEX) != null){
                addFileEntry(model, path + "/" + info.get_name());
            }
        } else if (info.get_file_type() == Gio.FileType.DIRECTORY && !info.get_is_hidden()){
            // Recursive search:
            addDirectory(model, path + "/" + info.get_name());
        }
    }
}

function addGioFile(model, file){
    // Gather information:
    let type = file.query_file_type(Gio.FileQueryInfoFlags.NONE, null);
    // Check whether a directory or a file wasen:
    if (type == Gio.FileType.REGULAR){
        addFileEntry(model, file.get_path());
    } else if (type == Gio.FileType.DIRECTORY){
        addDirectory(model, file.get_path());
    }
}

function addPath(model, path){
    addGioFile(model, Gio.file_new_for_path(path));
}

function addURI(model, uri){
    addGioFile(model, Gio.file_new_for_uri(uri));
}

/**
 * Called to build a preferences widget.
 * @return object any type of GTK+ widget to be placed inside the prefs window.
 */
function buildPrefsWidget(){
    let frame = new Gtk.Box({
        orientation: Gtk.Orientation.HORIZONTAL,
        width_request: 815,
        height_request: 600
    });

    return frame;
}
