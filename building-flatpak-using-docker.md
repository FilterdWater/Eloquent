# Building a Local Flatpak Using Docker

This guide explains how to build a test Flatpak of Eloquent inside a Docker container, install it on your system, and remove it when done.

The test Flatpak uses the same app ID (`re.sonny.Eloquent`) as the Flathub version, but is installed in the **user** scope. This lets it coexist with the Flathub version — the user install shadows the system one for your user only, and other users on the machine are unaffected.

## Prerequisites

```sh
sudo pacman -S git docker docker-compose docker-buildx
```

Initialize the `troll` submodule (required for the build):

```sh
git submodule update --init
```

## Build the Docker image

```sh
docker compose -f docker-compose.flatpak.yml build
```

This creates an image with `flatpak-builder` and the GNOME 49 Platform/SDK pre-installed.

## Build the Flatpak

```sh
docker compose -f docker-compose.flatpak.yml run --rm flatpak-builder
```

When complete, the file `re.sonny.Eloquent.flatpak` will be in the project root.

## Install and run

The flatpak requires the `org.gnome.Platform//49` runtime. If you already have Eloquent installed from Flathub, this runtime is already on your system. Otherwise, install it first:

```sh
flatpak install --user flathub org.gnome.Platform//49
```

Install the test flatpak in the **user** scope (shadows the Flathub version for your user only):

```sh
flatpak install --user re.sonny.Eloquent.flatpak
flatpak run re.sonny.Eloquent
```

The Flathub version remains installed on the system — `flatpak list --system` will show it. If you want to restore it immediately:

```sh
flatpak uninstall --user re.sonny.Eloquent
```

## Uninstall

```sh
flatpak uninstall --user re.sonny.Eloquent
```

This removes only your user install. The Flathub version (if present) reappears immediately — no reinstall needed.

## Clean up Docker resources

```sh
docker compose -f docker-compose.flatpak.yml down --rmi all
```

Remove the build artifacts:

```sh
rm -rf .flatpak-build .flatpak-repo re.sonny.Eloquent.flatpak
```
