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

import * as Settings from './settings.js';
import * as Notify from './notification.js';
import {gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import {Me, listXmlFiles} from './utils.js';
import { createFromXML } from './background.js';

/**
 * This is where the list of wallpapers is maintained and the current
 *  wallpaper is set.
 * This also includes jumping to next/previous wallpaper.
 * All Wallpaper-functionality is bundled in this class.
 */
export class Wallpaper {
    /**
     * Constructs a new class to do all the wallpaper-related work.
     * @private
     */
    constructor(){
        this._settings = new Settings.Settings(Me());
        this._notify = new Notify.Notification();
        this._queue = [];
        this._is_random = false;
        this._preview_callback = null;
        // Catch changes happening in the config-tool and update the list
        this._settings.bindKey(Settings.KEY_BACKGROUND_DIR, () => {
            this._queue.length = 0; // Clear the array, see http://stackoverflow.com/a/1234337/717341
            this._loadQueue();
            this._triggerPreviewCallback();
        });
        this._is_random = this._settings.isRandom();
        // Load images:
        this._loadQueue();
    }

    /**
     * <p>Set the function to be called, when the next image changes (due to a
     *  call to next(), shuffle() or order() ).</p>
     * <p>Calling this method will also cause the callback-function to be called
     *  immediately!</p>
     * @param callback the function to be called when the switch is done.
     *  This function will be passed an argument with the path of the next
     *  wallpaper.
     */
    setPreviewCallback(callback){
        // Validate:
        if (callback === undefined || callback === null || typeof callback !== "function"){
            throw TypeError("'callback' should be a function!");
        }
        // Set the callback:
        this._preview_callback = callback;
        // Callback:
        this._triggerPreviewCallback();
    }

    /**
     * Load the image-list from the settings, populate the Stack and
     *  randomize it, if necessary.
     * @private
     */
    _loadQueue(){
        this._indx = 0
        let bg_path = this._settings.getBackgroundDir();
        let xml_list = listXmlFiles(bg_path);
        for (let i=0; i<xml_list.length; i++) {
            let bg = createFromXML(xml_list[i]);
            this._queue.push(bg);
        }
        // Check if shuffle:
        if (this._is_random === true){
            this._fisherYatesQueue();
        }
    }

    /**
     * Return next Wallpaper index
     * @private
     */
    _getNextIndex() {
        return (this._indx + 1) % this._queue.length;
    }
    
    /**
     * Checks whether a preview-callback exists and calls it with the next wallpaper.
     * @see #setPreviewCallback
     * @private
     */
    _triggerPreviewCallback(){
        if (this._preview_callback !== null){
            this._preview_callback(this._queue[this._getNextIndex()]);
        }
    }

    /**
     * Sorts the image-list for iterative access.
     */
    order() {
        this._is_random = false;
        this._queue.length = 0; // Clear the array, see http://stackoverflow.com/a/1234337/717341
        this._loadQueue();
        // Callback:
        this._triggerPreviewCallback();
    }

    /**
     * Shuffle the image-list for random access.
     */
    shuffle() {
        this._is_random = true;
        // Shuffle the current queue
        this._fisherYatesQueue();
        // Callback:
        this._triggerPreviewCallback();
    }

    /**
     * Implementation of the "Fisher-Yates shuffle"-algorithm
     * that shuffles _image_queue
     * @private
     */
    _fisherYatesQueue() {
        let i = this._queue.length;
        if (i > 0) {    
            while (--i) {
                let j = Math.floor(Math.random() * (i + 1));
                let tempj = this._queue[j];
                this._queue[j] = this._queue[i];
                this._queue[i] = tempj;
            }
        }
    }

    /**
     * Slide to the next wallpaper in the list.
     */
    next() {
        if(this._queue.length > 1) {
            this._indx = this._getNextIndex();
            this._settings.setWallpaper(this._queue[this._indx]);
            this._triggerPreviewCallback();
        }
    }
}
