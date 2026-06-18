# Local Development Using Docker

This was tested on a machine running Archlinux + KDE Plasma + Wayland but should work fine for any Linux machine with Docker tooling available.

## Prerequisites

```bash
# Packages required on an Archlinux machine
sudo pacman -S git docker docker-compose docker-buildx
```

Initialize the troll submodule:

```sh
git submodule update --init
```

## Usage

**Wayland (default):**

```sh
docker compose build
docker compose run --rm dev
```

**X11 / XWayland:**

```sh
docker compose -f docker-compose.yml -f docker-compose.x11.yml build
docker compose -f docker-compose.yml -f docker-compose.x11.yml run --rm dev
```

## Inside the container

Once inside the container shell:

```sh
meson setup build --prefix=build/install
meson compile -C build
meson install -C build
./build/install/bin/re.sonny.Eloquent
```

Press `Ctrl+Shift+Q` on the Eloquent window to restart it.
Press `Ctrl+Shift+I` to open the GTK inspector.

## Cleaning up

**Remove the network**

```sh
docker compose down
```

**Remove the network and built image:**

```sh
docker compose down --rmi all
```
