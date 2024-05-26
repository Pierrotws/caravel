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

import Gdk from "gi://Gdk";
import Cairo from "gi://cairo";

/**
 * Generate a merged image from 2 image
 * @param left to use. only half left will be used.
 * @param right to use. only half right will be used.
 * @throws Error if dimensions of images in parameters differ
 * @returns merged image (half-left, half-right)
 */
export function mergeImage(left, right) {
    // Ensure both images are the same size
    if (left.get_width() !== right.get_width() || left.get_height() !== right.get_height()) {
        throw new Error("Images must have the same dimensions");
    }
    let width = left.get_width();
    let height = left.get_height();
    // Create a new surface to draw the merged image
    let surface = new Cairo.ImageSurface(Cairo.Format.ARGB32, width, height);
    let context = new Cairo.Context(surface);

    Gdk.cairo_set_source_pixbuf(context, left, 0, 0);
    // Draw the left half of image1
    context.rectangle(0, 0, width / 2, height);
    context.fill();
    // Draw the right half of image2
    Gdk.cairo_set_source_pixbuf(context, right, 0, 0);
    context.rectangle(width / 2, 0, width / 2, height);
    context.fill();
    // Paint the context onto the surface
    //cr.paint();
    return Gdk.pixbuf_get_from_surface(surface, 0, 0, width, height);
}
