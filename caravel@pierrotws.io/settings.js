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

export const KEY_DELAY = "delay";
export const KEY_RANDOM = "random";
export const KEY_BACKGROUND_DIR = "background-properties-path";
export const KEY_WALLPAPER = "picture-uri";
export const KEY_WALLPAPER_DARK = "picture-uri-dark";
export const KEY_OPTIONS = "picture-options"
export const KEY_SHADE_TYPE = "color-shading-type"
export const KEY_PCOLOR = "primary-color"
export const KEY_SCOLOR = "secondary-color"

export const KEY_ELAPSED_TIME = "elapsed-time";
export const KEY_CHANGE_LOCKSCREEN = "change-lockscreen";

export const BACKGROUND_PROPERTIES_DEFAULT = "/usr/share/gnome-background-properties";
export const DELAY_MINUTES_MIN = 1;
export const DELAY_MINUTES_DEFAULT = 5;
export const DELAY_HOURS_MAX = 24;
export const DELAY_MINUTES_MAX = DELAY_HOURS_MAX * 60;

export function valid_minutes(minutes) {
    return minutes >= DELAY_MINUTES_MIN && minutes <= DELAY_MINUTES_MAX;
}

/**
 * This class takes care of reading/writing the settings from/to the GSettings backend.
 */
export class Settings {

    static _schemaName = "org.gnome.shell.extensions.caravel";

    /**
     * Creates a new Settings-object to access the settings of this extension.
     * @private
     */
    constructor(extension) {
        let schemaDir = extension.dir.get_child('schemas').get_path();

        let schemaSource = Gio.SettingsSchemaSource.new_from_directory(
            schemaDir, Gio.SettingsSchemaSource.get_default(), false
        );
        let schema = schemaSource.lookup(Settings._schemaName, false);

        this._setting = new Gio.Settings({
            settings_schema: schema
        });
        this._background_setting = new Gio.Settings({
            schema: "org.gnome.desktop.background"
        });
        this._screensaver_setting = new Gio.Settings({
            schema: "org.gnome.desktop.screensaver"
        });
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
        this._setting.connect("changed::"+key, function(source, key){
            callback( source.get_value(key) );
        });
    }

    isDarkMode() {
        return (this._setting.get_string(DARK_KEY) !== "prefer-dark")
    }

    getKeyWallpaper() {
        return this.isDarkMode() ? KEY_WALLPAPER_DARK : KEY_WALLPAPER;
    }

    /**
     * Get the delay (in minutes) between the wallpaper-changes.
     * @returns int the delay in minutes.
     */
    getDelay() {
        var minutes = this._setting.get_int(KEY_DELAY);
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
        return this._setting.get_boolean(KEY_CHANGE_LOCKSCREEN);
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
        if (this._setting.get_int(key) == delay) { return; }
        if (this._setting.is_writable(key)){
            if (this._setting.set_int(key, delay)){
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
        return this._setting.get_boolean(KEY_RANDOM);
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
        if (this._setting.is_writable(key)){
            if (this._setting.set_boolean(key, isRandom)){
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
        return this._setting.get_string(KEY_BACKGROUND_DIR);
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
        // Set:
        let key = KEY_BACKGROUND_DIR;
        this._writeKey(this._setting, key, propPath);
        Gio.Settings.sync();
    }

    /**
     * Set the new Wallpaper.
     * @param bg a backgroundXml Object.
     * @throws string if there was a problem setting the new wallpaper.
     * @throws TypeError if the given path was invalid
     */
    setWallpaper(bg) {
        // Validate
        if (bg === undefined || bg === null ) { //||  !(bg instanceof BackgroundXml)) {
            throw TypeError("param should be a valid BackgroundXml. Got: '"+bg+"'");
        }
        this._writeKey(this._background_setting, KEY_WALLPAPER, "file://"+bg.filename_light);
        this._writeKey(this._background_setting, KEY_WALLPAPER_DARK, "file://"+bg.filename_dark);
        this._writeKey(this._background_setting, KEY_OPTIONS, bg.options);
        this._writeKey(this._background_setting, KEY_SHADE_TYPE, bg.shade_type);
        this._writeKey(this._background_setting, KEY_PCOLOR, bg.pcolor);
        this._writeKey(this._background_setting, KEY_SCOLOR, bg.scolor);

        if(this.getChangeLockScreen()) {
            this._writeKey(this._screensaver_setting, KEY_WALLPAPER, "file://"+bg.filename_light);
            this._writeKey(this._screensaver_setting, KEY_OPTIONS, bg.options);
            this._writeKey(this._screensaver_setting, KEY_SHADE_TYPE, bg.shade_type);
            this._writeKey(this._screensaver_setting, KEY_PCOLOR, bg.pcolor);
            this._writeKey(this._screensaver_setting, KEY_SCOLOR, bg.scolor);
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
        return this._setting.get_int(KEY_ELAPSED_TIME);
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
        if (this._setting.is_writable(KEY_ELAPSED_TIME)){
            if (this._setting.set_int(KEY_ELAPSED_TIME, time)){
                Gio.Settings.sync();
            } else {
                throw this._errorSet(key);
            }
        } else {
            throw this._errorWritable(key);
        }
    }

    _errorWritable(key) {
        return "The key '"+key+"' is not writable.";
    }
    _errorSet(key) {
        return "Couldn't set the key '"+key+"'";
    }
}
