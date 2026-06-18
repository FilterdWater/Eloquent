import Gio from "gi://Gio";
import Adw from "gi://Adw";
import Xdp from "gi://Xdp";
// import XdpGtk from "gi://XdpGtk4";

import Window from "./window.js";
import About from "./about.js";
import Preferences, { syncAutostart } from "./Preferences.js";
import ShortcutsWindow from "./ShortcutsWindow.js";
import { startLanguageTool, stopLanguageTool } from "./languagetool.js";

import "./style.css";

const portal = new Xdp.Portal();

function tryCreateSettings() {
  try {
    return new Gio.Settings({ schema_id: "re.sonny.Eloquent" });
  } catch {
    return null;
  }
}

export default function Application() {
  portal
    .set_background_status("LanguageTool server running", null)
    .catch(console.error);

  const settings = tryCreateSettings();

  const application = new Adw.Application({
    application_id: "re.sonny.Eloquent",
  });
  // Prevent application from quitting if no windows are open
  application.hold();

  application.connect("activate", () => {
    const { window } = Window({
      application,
      settings,
    });

    syncAutostart();

    (async () => {
      const parent = null;
      const success = await portal.request_background(
        parent,
        "Run LanguageTool in the background to make Eloquent faster and use 3rd party integrations.",
        ["re.sonny.Eloquent", "--gapplication-service"],
        null,
        null,
      );
      console.debug("request background succeeded", success);
    })().catch(console.error);
  });

  application.connect("shutdown", () => {
    stopLanguageTool().catch(console.error);
  });

  application.connect("startup", () => {
    startLanguageTool().catch(console.error);
  });

  const quit = new Gio.SimpleAction({
    name: "quit",
    parameter_type: null,
  });
  quit.connect("activate", () => {
    application.quit();
  });
  application.add_action(quit);
  application.set_accels_for_action("app.quit", ["<Primary>Q"]);

  application.set_accels_for_action("window.close", ["<Primary>W"]);

  const showPreferences = new Gio.SimpleAction({
    name: "preferences",
    parameter_type: null,
  });
  showPreferences.connect("activate", () => {
    Preferences({
      application,
      window: application.get_active_window(),
      settings,
    });
  });
  application.add_action(showPreferences);

  const showAboutDialog = new Gio.SimpleAction({
    name: "about",
    parameter_type: null,
  });
  showAboutDialog.connect("activate", () => {
    About({ application });
  });
  application.add_action(showAboutDialog);

  const showShortCutsWindow = new Gio.SimpleAction({
    name: "shortcuts",
    parameter_type: null,
  });
  showShortCutsWindow.connect("activate", () => {
    ShortcutsWindow({ application });
  });
  application.add_action(showShortCutsWindow);
  application.set_accels_for_action("app.shortcuts", ["<Primary>question"]);

  return application;
}
