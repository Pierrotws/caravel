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

export const SCHEMA_NAME = "org.gnome.shell.extensions.caravel";
export const SCREENSAVER_SCHEMA = "org.gnome.desktop.screensaver";
export const BG_SCHEMA = "org.gnome.desktop.background";

export const KEY_MODE = "color-scheme"
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