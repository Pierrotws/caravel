#!/bin/bash
rm -rf caravel@pierrotws.io.zip
cd caravel@pierrotws.io/
glib-compile-schemas schemas/
zip -r ../caravel@pierrotws.io.zip * -x 'po/*'
