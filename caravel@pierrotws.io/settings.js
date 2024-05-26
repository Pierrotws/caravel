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

import Gio from 'gi://Gio';
import { valid_minutes } from './define.js';
import { BackgroundXml } from './background.js';

import {
    KEY_DELAY,
    KEY_RANDOM,
    KEY_BACKGROUND_DIR,
    KEY_CURRENT_BG,
    KEY_PREVIEW_BOTH,
    BG_KEY_WALLPAPER,
    BG_KEY_WALLPAPER_DARK,
    BG_KEY_OPTIONS,
    BG_KEY_SHADE_TYPE,
    BG_KEY_PCOLOR,
    BG_KEY_SCOLOR,
    KEY_ELAPSED_TIME,
    KEY_CHANGE_LOCKSCREEN,
    DELAY_MINUTES_MIN,
    DELAY_MINUTES_DEFAULT,
    DELAY_MINUTES_MAX,
    BG_SCHEMA,
    MY_SCHEMA,
    SCREENSAVER_SCHEMA, 
    INTERFACE_SCHEMA,
    INTERFACE_KEY_MODE
} from './define.js';

/**
 * This class takes care of reading/writing the settings from/to the GSettings backend.
 */
export class Settings {

    /**
     * Creates a new Settings-object to access the settings of this extension.
     * @private
     */
    constructor(extension) {
        let schemaDir = extension.dir.get_child('schemas').get_path();

        let schemaSource = Gio.SettingsSchemaSource.new_from_directory(
            schemaDir, Gio.SettingsSchemaSource.get_default(), false
        );
        let schema = schemaSource.lookup(MY_SCHEMA, false);

        this._settings = new Gio.Settings({
            settings_schema: schema
        });
        this._bg_settings = new Gio.Settings({
            schema: BG_SCHEMA
        });
        this._screensaver_settings = new Gio.Settings({
            schema: SCREENSAVER_SCHEMA
        })
        this._interface_settings = new Gio.Settings({
            schema: INTERFACE_SCHEMA
        })
        this.bindKey(KEY_DELAY, (value) => {
            var minutes = value.get_int32();
            if (!valid_minutes(minutes)) {
                this.setDelay(DELAY_MINUTES_DEFAULT);
            }
        });
    }
    
    /**
     * <p>Binds the given 'callback'-function to the "changed"-signal on the given
     *  key.</p>
     * <p>The 'callback'-function is passed an argument which holds the new
     *  value of 'key'. The argument is of type "GLib.Variant". Given that the
     *  receiver knows the internal type, use one of the get_XX()-methods to get
     *  it's actual value.</p>
     * @see http://www.roojs.com/seed/gir-1.2-gtk-3.0/gjs/GLib.Variant.html
     * @param key the key to watch for changes.
     * @param callback the callback-function to call.
     */
    bindKey(key, callback) {
        // Validate:
        if (key === undefined || key === null || typeof key !== "string"){
            throw TypeError("The 'key' should be a string. Got: '"+key+"'");
        }
        if (callback === undefined || callback === null || typeof callback !== "function"){
            throw TypeError("'callback' needs to be a function. Got: "+callback);
        }
        // Bind:
        this._settings.connect("changed::"+key, function(source, key){
            callback( source.get_value(key) );
        });
    }

    /**
     * Get the delay (in minutes) between the wallpaper-changes.
     * @returns int the delay in minutes.
     */
    getDelay() {
        var minutes = this._settings.get_int(KEY_DELAY);
        if (!valid_minutes(minutes)) {
                this.setDelay(DELAY_MINUTES_DEFAULT);
                return DELAY_MINUTES_DEFAULT;
        }
        return minutes;
    }

    /**
     * Whether to set or not to set lockscreen
     * @returns b true if lockscreen must be set also
     */
    getChangeLockScreen() {
        return this._settings.get_boolean(KEY_CHANGE_LOCKSCREEN);
    }
    /**
     * Set the new delay in minutes.
     * @param delay the new delay (in minutes).
     * @throws TypeError if the given delay is not a number or less than 1
     */
    setDelay(delay) {
        // Validate:
        if (delay === undefined || delay === null || typeof delay !== "number" || !valid_minutes(delay)){
            throw TypeError("delay should be a number, in range [" + DELAY_MINUTES_MIN + ", " + DELAY_MINUTES_MAX + "]. Got: "+delay);
        }
        // Set:
        let key = KEY_DELAY;
        if (this._settings.get_int(key) == delay) { return; }
        if (this._settings.is_writable(key)){
            if (this._settings.set_int(key, delay)){
                Gio.Settings.sync();
            } else {
                throw this._errorSet(key);
            }
        } else {
            throw this._errorWritable(key);
        }
    }

    /**
     * Whether the order of the image-list should be random.
     * @returns boolean true if random, false otherwise.
     */
    isRandom(){
        return this._settings.get_boolean(KEY_RANDOM);
    }
    
    /**
     * Specify, whether the order of the image-list should be random or not.
     * @param isRandom true if random, false otherwise.
     * @throws TypeError if "isRandom" is not a boolean value.
     */
    setRandom(isRandom) {
        // validate:
        if (isRandom === undefined || isRandom === null || typeof isRandom !== "boolean"){
            throw TypeError("isRandom should be a boolean variable. Got: "+isRandom);
        }
        // Set:
        let key = KEY_RANDOM;
        if (this._settings.is_writable(key)){
            if (this._settings.set_boolean(key, isRandom)){
                Gio.Settings.sync();
            } else {
                throw this._errorSet(key);
            }
        } else {
            throw this._errorWritable(key);
        }
    }

    /**
     * Specify, whether to preview both light and dark wallpapers or not
     * @returns boolean true if both should be previewed, false otherwise.
     */
    shouldPreviewBoth() {
        return this._settings.get_boolean(KEY_PREVIEW_BOTH);
    }

    /**
     * Whether to preview both light and dark wallpapers or not.
     * @param previewBoth true if both should be previewed, false otherwise.
     * @throws TypeError if "previewBoth" is not a boolean value.
     */
    setPreviewBoth(previewBoth) {
        // validate:
        if (previewBoth === undefined || previewBoth === null || typeof previewBoth !== "boolean"){
            throw TypeError("isRandom should be a boolean variable. Got: "+previewBoth);
        }
        // Set:
        let key = KEY_PREVIEW_BOTH;
        if (this._settings.is_writable(key)){
            if (this._settings.set_boolean(key, previewBoth)){
                Gio.Settings.sync();
            } else {
                throw this._errorSet(key);
            }
        } else {
            throw this._errorWritable(key);
        }
    }

    /**
     * Path to the background properties files.
     * @returns path of background properties files.
     */
    getBackgroundDir() {
        return this._settings.get_string(KEY_BACKGROUND_DIR);
    }

    /**
     * Set the list of wallpaper-path's.
     * @param list the new list (array) of image-path's.
     * @throws TypeError if 'list' is not an array.
     */
    setBackgroundDir(propPath) {
        // Validate:
        if (propPath === undefined || propPath === null || typeof propPath !== "string"){
            throw TypeError("propPath should be a string variable. Got: "+propPath);
        }
        this._writeKey(this._settings, KEY_BACKGROUND_DIR, propPath);
        Gio.Settings.sync();
    }

    /**
     * Set the new Wallpaper.
     * @param bg a backgroundXml Object.
     * @throws string if there was a problem setting the new wallpaper.
     * @throws TypeError if the given backgrounXml was invalid
     */
    setWallpaper(bg) {
        // Validate
        if (bg === undefined || bg === null || !(bg instanceof BackgroundXml)) {
            throw TypeError("param should be a valid BackgroundXml. Got: '"+bg+"'");
        }
        this._writeKey(this._bg_settings, BG_KEY_WALLPAPER, "file://"+bg.wallpaper);
        this._writeKey(this._bg_settings, BG_KEY_WALLPAPER_DARK, "file://"+bg.wallpaper_dark);
        this._writeKey(this._bg_settings, BG_KEY_OPTIONS, bg.options);
        this._writeKey(this._bg_settings, BG_KEY_SHADE_TYPE, bg.shade_type);
        this._writeKey(this._bg_settings, BG_KEY_PCOLOR, bg.pcolor);
        this._writeKey(this._bg_settings, BG_KEY_SCOLOR, bg.scolor);
        this._writeKey(this._settings, KEY_CURRENT_BG, bg.filepath);
        if(this.getChangeLockScreen()) {
            let wp = this.isDarkMode() ? bg.wallpaper_dark : bg.wallpaper;
            this._writeKey(this._screensaver_settings, BG_KEY_WALLPAPER, "file://"+wp);
            this._writeKey(this._screensaver_settings, BG_KEY_OPTIONS, bg.options);
            this._writeKey(this._screensaver_settings, BG_KEY_SHADE_TYPE, bg.shade_type);
            this._writeKey(this._screensaver_settings, BG_KEY_PCOLOR, bg.pcolor);
            this._writeKey(this._screensaver_settings, BG_KEY_SCOLOR, bg.scolor);
        }
        Gio.Settings.sync(); // Necessary: http://stackoverflow.com/questions/9985140
    }
    
    /**
     * Write dconf string property in various dconf paths
     * @param setting the dconf destination path.
     * @param key the dconf key
     * @param value the string value to write
     * @throws Custom erros
     */
    _writeKey(setting, key, value) {
        if (setting.is_writable(key)) {
            if (!setting.set_string(key, value)) {
                throw this._errorSet(key);
            }
        } else {
            throw this._errorWritable(key);
        }
    }

    /**
     * Get the time (in minutes), which has already elapsed from the last set timeout-interval.
     * @return int the elapsed time in minutes.
     */
    getElapsedTime() {
        return this._settings.get_int(KEY_ELAPSED_TIME);
    }

    /**
     * Set the time (in minutes) which has elapsed from the last set timeout-interval.
     * @param time the time (in minutes) that has elapsed.
     * @throws TypeError if 'time' wasn't a number or less than 0.
     */
    setElapsedTime(time) {
        // Validate:
        if (time === undefined || time === null || typeof time != "number" || time < 0){
            throw TypeError("'time' needs to be a number, greater than 0. Given: "+time);
        }
        // Write:
        if (this._settings.is_writable(KEY_ELAPSED_TIME)){
            if (this._settings.set_int(KEY_ELAPSED_TIME, time)){
                Gio.Settings.sync();
            } else {
                throw this._errorSet(key);
            }
        } else {
            throw this._errorWritable(key);
        }
    }

    isDarkMode() {
        return (this._interface_settings.get_string(INTERFACE_KEY_MODE) == "prefer-dark");
    }

    _errorWritable(key) {
        return "The key '"+key+"' is not writable.";
    }
    _errorSet(key) {
        return "Couldn't set the key '"+key+"'";
    }
}
