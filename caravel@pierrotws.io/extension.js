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

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';
import St from 'gi://St';

// Import own libs:
import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import {Me} from './utils.js';
import * as Widget from './widgets.js';
import * as Wallpaper from './wallpaper.js';
import * as Settings from './settings.js';
import * as Time from './timer.js';

let wallpaper_control;
let settings;
let timer;
let menu_button;

class CaravelButton extends PanelMenu.Button {
    static {
        GObject.registerClass(this);
    }

    _init(extension) {
        super._init(0, 'caravel', false);
        this.extension = extension;
        const box = new St.BoxLayout({
            style_class: 'panel-status-menu-box',
        });
        this._icon = new St.Icon({
            icon_name: 'folder-pictures-symbolic',
            style_class: 'system-status-icon'
        });
        box.add_child(this._icon);
        this.add_child(box);
        this._buildMenu();
    }

    _buildMenu(){
        // Add the Widgets to the menu:
        this.menu.addMenuItem(new Widget.LabelWidget(_("Up Next")).item);
        let next_wp_widget = new Widget.NextWallpaperWidget();
        wallpaper_control.setPreviewCallback(function(wp) {
            try {
                next_wp_widget.setWallpaper(wp);
            } catch (e){
                console.error("unknown error", e);
            }
        });
        this.menu.addMenuItem(next_wp_widget.item);
        //Add Delay slider
        let minutes = 0;
        let unit = _("minutes");
        if (settings.getDelay() > 60 ) {
            minutes = Math.floor(settings.getDelay() / 60);
            unit = _("hours");
        } else {
            minutes = settings.getDelay();
        }
        let delay_slider_label = new Widget.LabelWidget(_("Delay (%d %s)").format(minutes, unit) );
        this.menu.addMenuItem(delay_slider_label.item);
        let delay_slider = new Widget.DelaySlider(settings.getDelay() );
        this.menu.addMenuItem(delay_slider.item);
        // ---------------------------------------
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        let control = new Widget.WallpaperControlWidget(function() {
            wallpaper_control.next();
            timer.restart();
        }, function(state) {
            if (state){
                timer.begin();
            } else {
                timer.stop();
            }
        }, function(state) {
            if (state === true) {
                wallpaper_control.shuffle();
            } else {
                wallpaper_control.order();
            }
            // Also write the new setting:
            settings.setRandom(state);
        });
        control.setOrderState(settings.isRandom());
        this.menu.addMenuItem(control.item);

        // React on control-interaction:
        timer.setCallback(function() {
            wallpaper_control.next();
        });

        // React on delay-change:
        let valueChanged = function() {
            let minutes = delay_slider.getMinutes();
            console.log('Extension Slider value-changed: returned minutes = ' + minutes);
            let label_text;
            if (minutes > 60) {
                label_text = _("Delay (%d %s)").format(Math.floor(minutes / 60), _("hours"));
            } else {
                label_text = _("Delay (%d %s)").format(minutes, _("minutes"));
            }
            delay_slider_label.setText(label_text);
            settings.setDelay(minutes);
        };
        try {
          delay_slider.connect('value-changed', valueChanged);
        } catch(e) {
          delay_slider.connect('notify::value', valueChanged);
        }

        settings.bindKey(Settings.KEY_DELAY, (value) => {
            var minutes = value.get_int32();
            if (Settings.valid_minutes(minutes)) {
                delay_slider.setMinutes(minutes);
            }
        });
    }
}

export default class CaravelExtension extends Extension {
    /**
    * Called when the extension is first loaded (only once)
    */
    _init() {
        Me().initTranslations();
    }
    
    /*
     * Called when the extension is activated (maybe multiple times)
     */
    enable() {
        wallpaper_control = new Wallpaper.Wallpaper();
        settings = new Settings.Settings(this);
        timer = new Time.Timer();
        menu_button = new CaravelButton(this);
        Main.panel.addToStatusArea('caravel', menu_button, 1);
        timer.begin();
    }

    /**
     * Called when the extension is deactivated (maybe multiple times)
     */
    disable() {
        wallpaper_control = null;
        settings = null;
        timer.stop();
        timer = null;
        menu_button.destroy();
        menu_button = null;
    }
}
