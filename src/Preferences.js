import Gio from "gi://Gio";
import GLib from "gi://GLib";
import { build } from "troll";

import Interface from "./Preferences.blp" assert { type: "uri" };

export const AUTOSTART_FILE = GLib.build_filenamev([
  GLib.get_home_dir(),
  ".config",
  "autostart",
  "re.sonny.Eloquent.desktop",
]);

const AUTOSTART_CONTENT = `[Desktop Entry]
Type=Application
Name=Eloquent
Comment=Grammar and spell checker
Exec=re.sonny.Eloquent --gapplication-service
Icon=re.sonny.Eloquent
Categories=Office;
Terminal=false
`;

function getSettings() {
  try {
    return new Gio.Settings({ schema_id: "re.sonny.Eloquent" });
  } catch {
    return null;
  }
}

export function syncAutostart() {
  const settings = getSettings();
  if (settings) {
    updateAutostartFile(settings.get_boolean("autostart"));
  }
}

function updateAutostartFile(enabled) {
  try {
    if (enabled) {
      const dir = GLib.build_filenamev([
        GLib.get_home_dir(),
        ".config",
        "autostart",
      ]);
      GLib.mkdir_with_parents(dir, parseInt("0755", 8));
      GLib.file_set_contents(AUTOSTART_FILE, AUTOSTART_CONTENT);
    } else {
      GLib.remove(AUTOSTART_FILE);
    }
  } catch (err) {
    logError(err, "Failed to update autostart file");
  }
}

let preferences_window_instance = null;

export default function Preferences({ window, application, settings }) {
  if (preferences_window_instance) {
    preferences_window_instance.present();
    return;
  }

  const { preferences_window, switch_exit_on_close, switch_autostart } =
    build(Interface);

  preferences_window.set_transient_for(window);

  if (settings) {
    const bind_flags = Gio.SettingsBindFlags.DEFAULT;

    settings.bind(
      "exit-on-close",
      switch_exit_on_close,
      "active",
      bind_flags,
    );

    settings.bind(
      "autostart",
      switch_autostart,
      "active",
      bind_flags,
    );

    settings.connect("changed::autostart", () => {
      updateAutostartFile(settings.get_boolean("autostart"));
    });
  }

  preferences_window.connect("close-request", () => {
    preferences_window_instance = null;
    return false;
  });

  preferences_window_instance = preferences_window;
  preferences_window.present();

  return { preferences_window };
}
