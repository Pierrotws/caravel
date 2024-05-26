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

import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import { EXTENSION_UUID } from "../define.js";

/**
 * Helper to return ref on extension 
 * @returns caravel extension (from its uuid)
 */
export function Me() {
    let self = Me;
    if (self._me == null) {
        self._me = Extension.lookupByUUID(EXTENSION_UUID);
    }
    return self._me;
}
