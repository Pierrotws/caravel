# Caravel

A simple Gnome-Shell Extension for an automatic background-image (wallpaper) slideshow.

## Attention

This is a fork of original Lukas Knuth [BackSlide](https://gitlab.com/p91paul/BackSlide) extension

## 

Caravel will use default themed backgrounds from gnome.
Custom images can be used by providing "background-properties-path".

To create background-properties file, check my [simple generator here](https://github.com/Pierrotws/background-properties-generator)

## Installation

### Manual installation

If you need to "install" the extension manually, you'll need the following utilities:

* `git`
* `glib-compile-schemas`
* `gnome-tweak-tool` (Optional)

The packages which include the above tools may vary across different Linux distributions. Check your distributions wiki/package list to find the most suitable package for you.

There are multiple stable branches, depending on the version of GnomeShell you're running. Check the `DEVELOPMENT.md`-file for information on those branches. To build the extension, follow these steps:

    :::bash
    # Clone the repository (you might already did this!)
    git clone https://github.com/Pierrotws/caravel.git
    cd caravel
    # "Compile" the settings-schema:
    glib-compile-schemas caravel\@pierrotws.io/schemas/
    # Copy the files over to the local extension directory:
    cp -r caravel\@pierrotws.io/ ~/.local/share/gnome-shell/extensions/

Afterwards, you can activate the extension either by using the `gnome-tweak-tool` or at [extensions.gnome.org/local](https://extensions.gnome.org/local/)

## Settings

All settings can be changed from the `gnome-shell-extension-prefs`-tool or from the command line. Although you can set them using the `dconf`-tool, **using the frontend/widget is preferred!**.

* **Delay (in minutes) between wallpaper changes:** (*default*: `5`)

`dconf write /org/gnome/shell/extensions/caravel/delay 15`

* **Whether or not the wallpaper-list should be shuffled** (*default*: `true`)

`dconf write /org/gnome/shell/extensions/caravel/random true|false`

* **The List of wallpapers as a string-array of absolute, unix-styled path's:** (*default*: `[/usr/share{gnome-background-properties]`)

`dconf write /org/gnome/shell/extensions/caravel/background-properties-path "${HOME}/.local/share/gnome-background-properties"`

* **The already elapsed time (in minutes) from the last interval** (*default*: `0`)

`dconf write /org/gnome/shell/extensions/caravel/elapsed-time 0`

Settings changed, using the `dconf`-tool will **apply, after the extension is restarted**.

## Troubleshooting

### Changing background hangs/freezes the system

Some users have been experiencing short freezes while changing background. If it happens to you, try setting this gnome preference (see https://gitlab.com/p91paul/BackSlide/-/issues/68):


    gsettings set org.gnome.nautilus.desktop background-fade false


## Contribute

If you are a developer/translator and you want to contribute to BackSlide, make sure to read "DEVELOPMENT.md" or "TRANSLATION.md" respectively.
