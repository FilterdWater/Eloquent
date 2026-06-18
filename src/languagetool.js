import Gio from "gi://Gio";
import GLib from "gi://GLib";
import Soup from "gi://Soup";
import { once } from "../troll/src/async.js";

const Signals = imports.signals;

const signals = {};
Signals.addSignalMethods(signals);

let proc_language_tool;
let ready = false

const PORT = 8081;
const HOST = GLib.getenv("LANGUAGETOOL_HOST") || "127.0.0.1";
const LANGUAGETOOL_DIR = GLib.getenv("LANGUAGETOOL_DIR") || "/app/LanguageTool";
const LANGUAGETOOL_CONFIG = GLib.getenv("LANGUAGETOOL_CONFIG") || "/app/share/server.properties";

async function onReady() {
  if (ready) return;
  await once(signals, "ready");
}

export async function startLanguageTool() {
  if (ready) return;

  if (HOST !== "127.0.0.1") {
    signals.emit("ready");
    ready = true;
    return;
  }

  if (proc_language_tool) return;

  proc_language_tool = Gio.Subprocess.new(
    [
      "java",
      // Workaround for JAXP entity size limit on Java 17+
      // https://forum.languagetool.org/t/error-running-server-on-java-17/7441
      "-Djdk.xml.totalEntitySizeLimit=2147480000",
      "-Djdk.xml.entityExpansionLimit=2147480000",
      "-cp",
      `${LANGUAGETOOL_DIR}/languagetool-server.jar`,
      "org.languagetool.server.HTTPServer",
      // Required for Thunderbird
      // https://forum.languagetool.org/t/problem-with-local-server-with-thunderbird/7313
      "--allow-origin",
      "--port",
      PORT.toString(),
      "--config",
      LANGUAGETOOL_CONFIG,
    ],
    // Gio.SubprocessFlags.NONE,
    Gio.SubprocessFlags.INHERIT_FDS | Gio.SubprocessFlags.STDOUT_PIPE,
  );

  const stdout_stream = new Gio.DataInputStream({
    base_stream: proc_language_tool.get_stdout_pipe(),
    close_base_stream: true,
  });

  for await (const line of createReadLineIterator(stdout_stream)) {
    console.debug(line);
    if (line?.endsWith("Server started")) break;
  }

  signals.emit('ready');
  ready = true;
}

export async function stopLanguageTool() {
  proc_language_tool?.force_exit();
}

const decoder = new TextDecoder();

export async function request(method, path, fields = {}) {
  await onReady();

  // For some reason `send_async` takes 5+s when reusing session
  // message.set_force_http1(true); makes no difference
  const session = new Soup.Session();
  const encoded = Soup.form_encode_hash(fields);

  const message = Soup.Message.new_from_encoded_form(
    method,
    `http://${HOST}:${PORT}/v2/${path}`,
    encoded,
  );

  const input_stream = await session.send_async(message, null, null);
  const { status_code, reason_phrase } = message;
  if (status_code !== 200) {
    throw new Error(`Got ${status_code}, ${reason_phrase}`);
  }

  const output_stream = Gio.MemoryOutputStream.new_resizable();
  await output_stream.splice_async(
    input_stream,
    Gio.OutputStreamSpliceFlags.CLOSE_TARGET,
    GLib.PRIORITY_DEFAULT,
    null,
  );
  const bytes = output_stream.steal_as_bytes();

  const str = decoder.decode(bytes.toArray());

  return JSON.parse(str);
}

export async function check(text, language = "auto") {
  return request("POST", "check", { text, language });
}

export async function getLanguages() {
  return request("GET", "languages");
}

Gio._promisify(
  Gio.DataInputStream.prototype,
  "read_line_async",
  "read_line_finish_utf8",
);

async function* createReadLineIterator(dataInputStream, ioPriority = Gio.PRIORITY_DEFAULT) {
  while (true) {
    // eslint-disable-next-line no-await-in-loop
    const [line] = await dataInputStream.read_line_async(ioPriority, null)
    if (line === null)
      return;
    yield line;
  }
}
