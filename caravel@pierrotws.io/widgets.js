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

import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as Slider from 'resource:///org/gnome/shell/ui/slider.js';
import { gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';
import { DELAY_MINUTES_MIN, DELAY_HOURS_MAX } from './define.js';
import { valid_minutes } from './define.js';
import { mergeImage } from './utils/image.js';
import { Me } from './utils/me.js'

import St from 'gi://St';
import GObject from 'gi://GObject';
import Cogl from 'gi://Cogl';
import GdkPixbuf from 'gi://GdkPixbuf';
import Clutter from 'gi://Clutter';

/**
 * A Button to open the "gnome-shell-extension-prefs"-tool to configure this extension.
 */
export class PrefsButton extends GObject.Object {
    static {
        GObject.registerClass(this);
    }

    /**
     * Creates a new Button to open the prefs of this extension.
     * @param menu the menu to be toggled when the button is pressed.
     * @private
     */
    _init(menu) {
        this.item = new PopupMenu.PopupBaseMenuItem();
        this._extension = Me();
        this._menu = menu;
        // The Label:
        this._icon = new St.Icon({
            icon_name: 'emblem-system-symbolic',
            style_class: 'popup-menu-icon',
        });
        this.item.add_child(this._icon);

        // Connect:
        this.item.connect('activate', this._onClick.bind(this));
    }

    _onClick() {
        if(this._menu !== null) {
            this._menu.close(); // Close the menu.
            this._extension.openPreferences();
        }
        else {
            console.warn("menu is null, maybe a problem");
        }
    }
}

// -------------------------------------------------------------------------------

/**
 * Shows a preview of the next wallpaper to be set.
 */
export class NextWallpaperWidget extends GObject.Object {
    static {
        GObject.registerClass(this);
    }

    /**
    * Constructor for GObject
    * @param settings settings instance
    * @param bgXml actual backgroundXml
    */
    _init(settings, bgXml) {
        this._settings = settings;
        this._actual_mode = this._settings.isDarkMode();
        this.item = new PopupMenu.PopupBaseMenuItem({reactive: false});
        // Overall Box:
        this._box = new St.BoxLayout({
            vertical: true,
            style_class: 'middle-aligned',
        });
        this._texture = new Clutter.Actor();
        this._icon = new Clutter.Actor();
        this._img = new Clutter.Image();
        this._wallpaper = new St.Bin({
            style_class: "overlay"
        });
        this.item.add_child(this._box);
        
        //this.setWallpaper(bgXml);
        
        // There is no backgroundXml set yet
        this._bg_xml = null;
        // The computer-picture:
        let screen_image = Me().dir.get_child('img').get_child("screen.png");

        let initial_pixbuf = GdkPixbuf.Pixbuf.new_from_file(screen_image.get_path());

        this._img.set_data(initial_pixbuf.get_pixels(),
                initial_pixbuf.get_has_alpha() ? Cogl.PixelFormat.RGBA_8888
                                : Cogl.PixelFormat.RGB_888,
                initial_pixbuf.get_width(),
                initial_pixbuf.get_height(),
                initial_pixbuf.get_rowstride());
        this._icon.set_content(this._img);
        this._icon.set_size(240,140);     
        
        this._icon_bin = new St.Bin({
            child: this._icon, // The icon has much space on top/bottom,
        });
        this._box.add_child(this._icon_bin);
        this._box.add_child(this._wallpaper);
    }

    /**
     * Load the (next) image to be set as the wallpaper into the widget.
     * @param backgroundXml the backgrounXml object of image to preview.
     */
    setWallpaper(backgroundXml) {
        this._bg_xml = backgroundXml;
        let new_img = new Clutter.Image();
        let buf;
        if(this._settings.shouldPreviewBoth()) {
            let left = GdkPixbuf.Pixbuf.new_from_file(this._bg_xml.wallpaper);
            let right = GdkPixbuf.Pixbuf.new_from_file(this._bg_xml.wallpaper_dark);
            buf = mergeImage(left, right);    
        }
        else {
            this._actual_mode = this._settings.isDarkMode();
            //Then load the one in use (depending on darkMode)
            let path = this._actual_mode ? this._bg_xml.wallpaper_dark : this._bg_xml.wallpaper;
            buf = GdkPixbuf.Pixbuf.new_from_file(path);
        }
        let isSet = new_img.set_data(buf.get_pixels(),
                buf.get_has_alpha() ? Cogl.PixelFormat.RGBA_8888
                                : Cogl.PixelFormat.RGB_888,
                buf.get_width(),
                buf.get_height(),
                buf.get_rowstride());
        if (isSet === false) {
            throw "Cannot set created image";
        }
        this._texture.set_content(new_img);
        this._wallpaper.set_child(this._texture);
        this._icon.set_content(new_img);
    }

    /**
     * Reload the image if necessary into the widget.
     */
    checkWallpaper() {
        if(!this._settings.shouldPreviewBoth()) {
            //Check if background has been set yet
            if(this._bg_xml != null) {
                //Check if dark-mode has changed.
                if(this._actual_mode != this._settings.isDarkMode()){
                    //then reload wallpaper with last one
                    this.setWallpaper(this._bg_xml);
                }
            }
        }
        //Nothing to reload if both are previewed
    }

    destroy() {
        this._wallpaper.destroy();
        this._wallpaper = null;

        // Call the base-implementation:
        PopupMenu.PopupBaseMenuItem.prototype.destroy.call(this.item);
    }
}

// -------------------------------------------------------------------------------

const STOP_TIMER_STATE = "stop";
const START_TIMER_STATE = "start";

/**
 * The whole widget including the loop/random, pause/play and next buttons.
 * This widget will emit multiple signals to be handled in a central place:
 * <ul>
 *     <li>"next-wallpaper" -> Emitted, when the next-button was pressed.</li>
 *     <li>"timer-state-changed" -> Emitted, when the timers state changed (start/stop)</li>
 *     <li>"order-state-changed" -> Emitted, when the wallpaper-order changes</li>
 * </ul>
 */
export class WallpaperControlWidget extends GObject.Object {
    static {
        GObject.registerClass({
            Signals: { 'next-wallpaper': {},
               'timer-state-changed': { param_types: [ GObject.TYPE_BOOLEAN ] },
               'order-state-changed': { param_types: [ GObject.TYPE_BOOLEAN ] }
            }
        }, this);
    }

    /**
     * Creates a new control-widget.
     * @private
     */
    _init(wallpaperChanged, timerStateChanged, orderStateChanged, menu) {
        this.item = new PopupMenu.PopupBaseMenuItem({reactive: false});
        // Add the layout:
        this._box = new St.BoxLayout({
            x_expand: true,
            style_class: 'menu-button-container'
        });

        this.item.add_child(this._box);

        // Add the buttons:
        this._order_button = new ControlToggleButton(
            "media-playlist-shuffle", orderStateChanged
        );
        this._box.add_child(this._order_button.actor);
        
        let timer_button = new StateControlButton(
            [
                {
                    name: STOP_TIMER_STATE,
                    icon: "media-playback-pause"
                }, {
                    name: START_TIMER_STATE,
                    icon: "media-playback-start"
                }
            ], function(state) {
              timerStateChanged(state.name === START_TIMER_STATE);
            }
        );
        timer_button.setState(STOP_TIMER_STATE);
        this._box.add_child(timer_button.actor);
        let skip_button = new ControlButton("media-skip-forward", wallpaperChanged);
        this._box.add_child(skip_button.actor);
        //add spacer
        this._box.add_child(new St.BoxLayout({ x_expand: true }));
        let prefs_button = new PrefsButton(menu);
        this._box.add_child(prefs_button.item);
    }

    /**
     * Set the state of the order-button.
     * @param isRandom whether the wallpaper-order is random or not.
     */
    setOrderState(isRandom) {
        this._order_button.setState(isRandom);
    }

    /**
     * Emits the "order-state-changed"-signal, to be caught upstream.
     * @param state the state of the wallpaper-order.
     * @private
     */
    _orderStateChanged(state) {
        this.emit("order-state-changed", state);
    }

    /**
     * Emits the "next-wallpaper"-signal, to be caught upstream.
     * @private
     */
    _nextWallpaper() {
        console.log("_nextWallpaper this ");
        this.emit("next-wallpaper"); // Custom signal
    }

    /**
     * Emits the "timer-state-changed"-signal, to be caught upstream.
     * @param state the state of the widget. See STOP_WIDGET_TIMER_STATE and START_WIDGET_TIMER_STATE
     * @private
     */
    _timerStateChanged(state) {
        this.emit("timer-state-changed", );
    }

}

/**
 * A simple button, styled to be used inside the "WallpaperControlWidget".
 */
export class ControlButton extends GObject.Object {
    static {
        GObject.registerClass(this);
    }

    /**
     * Creates a new button for use inside "WallpaperControlWidget"
     * @param icon the name of the icon, see http://standards.freedesktop.org/icon-naming-spec/icon-naming-spec-latest.html
     * @param callback the callback for the "click"-event.
     * @private`
     */
    _init(icon, callback){
        this.icon = new St.Icon({
            icon_name: icon + "-symbolic", // Get the symbol-icons.
            icon_size: 20
        });

        this.actor = new St.Button({
            style_class: 'notification-icon-button control-button', // buttons styled like in Rhythmbox-notifications
            child: this.icon
        });
        this.icon.set_style('padding: 0px');
        this.actor.set_style('padding: 8px'); // Put less space between buttons
        this.actor.connect('clicked', callback);
    }

    /**
     * Set this buttons icon to the given icon-name.
     * @param icon the icon-name.
     */
    setIcon(icon){
        this.icon.icon_name = icon+'-symbolic';
    }
}

/**
 * A "ControlButton" which also maintains multiple states with different icons.
 * For every state-change (click) the given callback-function will be called with
 *  a parameter, indicating the current (new) state.
 */
export class StateControlButton extends GObject.Object {
    static {
        GObject.registerClass(this);
    }

    /**
     * <p>Create a new, stateful button for use inside "WallpaperControlWidget"</p>
     * <p>For the different states, an array of objects is used. The object will be passed
     *  as an argument to the given callback-function, when the state changes. Mandatory elements
     *  are: "icon", "name".</p>
     * <code>
     *     {
     *       name: "State-name",
     *       icon: "icon-name for the state"
     *     }
     * </code>
     * @param states an array of objects with information about the possible states.
     * @param callback the callback-function for the "click"-signal.
     * @private
     */
    _init(states, callback){
       this._state_index = 0;
       this._states = [];
       this._callback = null;
       this._locked = false;
        // Validate:
        if (states.length < 2){
            throw RangeError("The 'states'-array should contain 2 or more elements.");
        }
        for (let i in states){
            if (states[i].icon === undefined || states[i].name === undefined){
                throw TypeError("objects in the 'states'-array need an 'icon' and 'name'-property!");
            }
        }
        // Initialize:
        this._states = states;
        this._state_index = 0;

        this.icon = new St.Icon({
            icon_name: this._states[this._state_index].icon + "-symbolic", // Get the symbol-icons.
            icon_size: 20
        });

        this.actor = new St.Button({
            style_class: 'notification-icon-button control-button', // buttons styled like in Rhythmbox-notifications
            child: this.icon
        });
        this.icon.set_style('padding: 0px');
        this.actor.set_style('padding: 8px'); // Put less space between buttons

        if (callback !== undefined || callback !== null){
            this._callback = callback;
        }
        this.actor.connect('clicked', this._clicked.bind(this));
    }

    /**
     * Called when the stateful button is clicked.
     * FOR INTERNAL USE ONLY!
     * @private
     */
    _clicked(){
        // Call-Back:
        if (this._callback !== null){
            this._locked = true;
            this._callback( this._states[this._state_index] );
            this._locked = false;
        }
        // Set new state:
        if (this._state_index+1 >= this._states.length){
            this._state_index = 0;
        } else {
            this._state_index++;
        }
        // change Icon.
        this.setIcon( this._states[this._state_index].icon );
    }

    /**
     * Set the state of this button. This will NOT trigger the callback function!
     * @param state the state-name of the button.
     */
    setState(state){
        if (state === this._states[this._state_index]){
            return; // It's already this state.
        }
        if (this._locked){
            return; // Locked to prevent concurrent changes.
        }
        for (let i in this._states){
            if (this._states[i].name === state){
                this._state_index = i;
                this.setIcon(this._states[i].icon);
            }
        }
    }

    /**
     * Set this buttons icon to the given icon-name.
     * @param icon the icon-name.
     */
    setIcon(icon){
        this.icon.icon_name = icon+'-symbolic';
    }

}

/**
 * A "ControlButton" which can be active or inactive. To be used in "WallpaperControlWidget".
 */
export class ControlToggleButton extends GObject.Object {
    static {
        GObject.registerClass(this);
    }

    /**
     * Create a new toggle button.
     * @param icon the icon to use for the button
     * @param callback the click-callback for the button. The functions first parameter will be
     *  the new state of the button.
     * @private
     */
    _init(icon, callback){
        this.icon = new St.Icon({
            icon_name: icon + "-symbolic", // Get the symbol-icons.
            style_class: "popup-menu-icon",
            icon_size: 20
        });

        this.actor = new St.Button({
            toggle_mode: true,
            style_class: 'message-list-clear-button button button-action',
            child: this.icon
        });
        this.icon.set_style('padding: 0px');
        this.actor.set_style('padding: 8px'); // Put less space between buttons

        if (callback != undefined || callback != null){
            this._callback = callback;
        }
        this.actor.connect('clicked', this._onToggle.bind(this));
    }

    _onToggle(){
        // Glow the image:
        if (this.actor.checked){
            this.actor.style_class = 'notification-icon-button';
        } else {
            this.actor.style_class = 'notification-icon-button untoggled';
        }
        // Trigger callback:
        if (this._callback !== null){
            this._callback(this.actor.checked);
        }
    }

    /**
     * Set the state of the button (without triggering the callback).
     * @param on whether the button is toggled on or not.
     */
    setState(on){
        if (typeof on === "boolean"){
            this.actor.checked = on;
            if (on){
                this.actor.style_class = 'notification-icon-button';
            }
        }
    }
}

// -------------------------------------------------------------------------------

// borrowed from: https://github.com/eonpatapon/gnome-shell-extensions-mediaplayer
export class SliderItem extends GObject.Object {
    static {
        GObject.registerClass(this);
    }

    _init(value) {
        this.item = new PopupMenu.PopupBaseMenuItem({reactive: false});
        this._slider = new Slider.Slider(value);
        this.item.add_child(this._slider);
    }

    setValue(value) {
        if (this._slider.setValue)
          this._slider.setValue(value);
        else
          this._slider.value = value;
    }

    getValue() {
        return this._slider._getCurrentValue();
    }

    setIcon(icon) {
        this._icon.icon_name = icon + '-symbolic';
    }

    connect(signal, callback) {
        this._slider.connect(signal, callback);
    }
}


/**
 * Widget for setting the delay for the next Wallpaper-change.
 */


export class DelaySlider extends SliderItem {
    static {
        GObject.registerClass(this);
    }

    /**
     * Construct a new Widget.
     * @private
     */
    _init(minutes){
        super._init(0); // value MUST be specified!
        this._MINUTES_MAX = 59;
        this._MINUTES_MIN = DELAY_MINUTES_MIN;
        this._HOURS_MAX = DELAY_HOURS_MAX;
        this._HOURS_MIN = 1;
        this.setMinutes(minutes); // Set the real value.
    }

    /**
     * Set the value of the slider to x minutes.
     * @param minutes the value in minutes between _MINUTES_MAX and _MINUTES_MIN
     */
    setMinutes(minutes){
        // Validate:
        if (isNaN(minutes) || !valid_minutes(minutes)){
            throw TypeError("'minutes' should be an integer between "
                +this._MINUTES_MIN+" and "+this._HOURS_MAX*60);
        }

        let value = 0;
        if (minutes <= this._MINUTES_MAX){
            value = (minutes - this._MINUTES_MIN) / (this._MINUTES_MAX - this._MINUTES_MIN) / 2;
        } else {
            value = (((minutes / 60) - this._HOURS_MIN) / (this._HOURS_MAX - this._HOURS_MIN) / 2) + 0.5;
        }

        this.setValue(value);
    }

    /**
     * Get the value in minutes from the slider.
     * @return int the value in minutes.
     */
    getMinutes(){
        let minutes = 0;
        if (this.getValue() < 0.5) {
            minutes = this._MINUTES_MIN + (this.getValue() * 2) * (this._MINUTES_MAX - this._MINUTES_MIN);
        } else {
            minutes = (this._HOURS_MIN + (this.getValue() - 0.5) * 2 * (this._HOURS_MAX - this._HOURS_MIN)) * 60;
        }

        return (minutes < this._MINUTES_MIN) ? this._MINUTES_MIN : Math.floor(minutes);
    }
}

// -------------------------------------------------------------------------------

/**
 * A simple label which only displays the given text.
 */
export class LabelWidget extends GObject.Object {
    static {
        GObject.registerClass(this);
    }

    _init(text){
        this.item = new PopupMenu.PopupBaseMenuItem({reactive: false});
        this._label = new St.Label({
            text: text
        });

        this.item.add_child(this._label);
    }

    /**
     * Set the text for this label.
     * @param text the new text.
     */
    setText(text){
        this._label.text = text;
    }
}
