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
import Gio from 'gi://Gio'
import St from 'gi://St';
import * as MessageTray from 'resource:///org/gnome/shell/ui/messageTray.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

/**
 * A simple to use class for showing notifications.
 */
export class Notification {

    constructor(){
        this._source = new SimpleSource("Caravel", "dialog-error");
    }

    /**
     * Issue a simple notification.
     * @param title the notification-title
     * @param banner_text the text for the banner
     * @param body the body-text (larger).
     */
    notify(title, banner_text, body){
        Main.messageTray.add(this._source.source);
        let notification = new MessageTray.Notification( //this._source, title, banner_text,
            {
                source: this._source,
                title: title,
                body: banner_text + body,
                bodyMarkup: true,
            }
        );
        this._source.notify(notification);
    }
}

/**
 * A simple source-implementation for notifying new Notifications.
 */
export class SimpleSource {

    /**
     * Create a new simple source for notifications.
     * @param title the title
     * @param icon_name the image to show with the notifications.
     * @private
     */
    constructor(title, icon_name){
        this.source = new MessageTray.Source({
            title: title,
            icon: new Gio.ThemedIcon({name: icon_name}),
            iconName: icon_name,
            policy: MessageTray.NotificationPolicy.newForApp(),
        });
        this._icon_name = icon_name;
    }

    createNotificationIcon() {
        let iconBox = new St.Icon({
            icon_name: this._icon_name,
            icon_size: 48
        });
        if (St.IconType !== undefined){
            iconBox.icon_type = St.IconType.FULLCOLOR; // Backwards compatibility with 3.4
        }
        return iconBox;
    }

    open() {
        this.destroy();
    }
}
