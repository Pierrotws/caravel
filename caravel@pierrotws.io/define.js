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
 * Contains global constants
 */

export const EXTENSION_UUID = 'caravel@pierrotws.io';
export const MY_SCHEMA = "org.gnome.shell.extensions.caravel";
export const BG_SCHEMA = "org.gnome.desktop.background";
export const SCREENSAVER_SCHEMA = "org.gnome.desktop.screensaver";
export const INTERFACE_SCHEMA = "org.gnome.desktop.interface";

/* Caravel settings dconf keys */
export const KEY_CURRENT_BG = "last-background-xml-path";
export const KEY_DELAY = "delay";
export const KEY_RANDOM = "random";
export const KEY_ELAPSED_TIME = "elapsed-time";
export const KEY_CHANGE_LOCKSCREEN = "change-lockscreen";
export const KEY_BACKGROUND_DIR = "background-properties-path";
export const KEY_PREVIEW_BOTH = "preview-both-wallpapers";
export const BACKGROUND_PROPERTIES_DEFAULT = "/usr/share/gnome-background-properties";

/* background/screensaver dconf keys */
export const BG_KEY_WALLPAPER = "picture-uri";
export const BG_KEY_WALLPAPER_DARK = "picture-uri-dark";
export const BG_KEY_OPTIONS = "picture-options";
export const BG_KEY_SHADE_TYPE = "color-shading-type";
export const BG_KEY_PCOLOR = "primary-color";
export const BG_KEY_SCOLOR = "secondary-color";

/* 
 * background xml keys, because it's not the same -_-
 */
export const BG_XML_NAME = "name";
export const BG_XML_WALLPAPER = "filename";
export const BG_XML_WALLPAPER_DARK = "filename-dark";
export const BG_XML_OPTIONS = "options";
export const BG_XML_SHADE_TYPE = "shade_type";
export const BG_XML_PCOLOR = "pcolor";
export const BG_XML_SCOLOR = "scolor";


/* interface dconf keys */
export const INTERFACE_KEY_MODE = "color-scheme";

/* Timer defaults */
export const DELAY_MINUTES_MIN = 1;
export const DELAY_MINUTES_DEFAULT = 5;
export const DELAY_HOURS_MAX = 24;
export const DELAY_MINUTES_MAX = DELAY_HOURS_MAX * 60;
export function valid_minutes(minutes) {
    return minutes >= DELAY_MINUTES_MIN && minutes <= DELAY_MINUTES_MAX;
}
