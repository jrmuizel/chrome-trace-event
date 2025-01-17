/**
 * trace-event - A library to create a trace of your node app per
 * Google's Trace Event format:
 * // JSSTYLED
 *      https://docs.google.com/document/d/1CvAClvFfyA5R-PhYUmn5OOQtYMH4h6I0nSsKchNAySU
 */

//var stream = require("stream");
//var util = require("util");

// ---- Tracer

class Tracer /*extends stream.Readable*/ {
  constructor(opts = {}) {
    //super();
    if (typeof opts !== "object") {
      throw new Error("Invalid options passed (must be an object)");
    }

    if (opts.parent != null && typeof opts.parent !== "object") {
      throw new Error("Invalid option (parent) passed (must be an object)");
    }

    if (opts.fields != null && typeof opts.fields !== "object") {
      throw new Error("Invalid option (fields) passed (must be an object)");
    }

    if (
      opts.objectMode != null &&
      (opts.objectMode !== true && opts.objectMode !== false)
    ) {
      throw new Error(
        "Invalid option (objectsMode) passed (must be a boolean)"
      );
    }

    this.parent = opts.parent;

    if (this.parent) {
      this.fields = Object.assign({}, opts.parent.fields);
    } else {
      this.fields = {};
    }
    if (opts.fields) {
      Object.assign(this.fields, opts.fields);
    }

    if (!this.fields.pid) {
      // Perfetto doesn't need a pid but trace-viewer requires one
      this.fields.pid = 0
    }

    if (!this.fields.cat) {
      // trace-viewer *requires* `cat`, so let's have a fallback.
      this.fields.cat = "default";
    } else if (Array.isArray(this.fields.cat)) {
      this.fields.cat = this.fields.cat.join(",");
    }
    if (!this.fields.args) {
      // trace-viewer *requires* `args`, so let's have a fallback.
      this.fields.args = {};
    }

    if (this.parent) {
      // TODO: Not calling Readable ctor here. Does that cause probs?
      //      Probably if trying to pipe from the child.
      //      Might want a serpate TracerChild class for these guys.
      this._push = this.parent._push.bind(this.parent);
    } else {
      this._objectMode = Boolean(opts.objectMode);
      var streamOpts = { objectMode: this._objectMode };
      if (this._objectMode) {
        this._push = this.push;
      } else {
        this._push = this._pushString;
        streamOpts.encoding = "utf8";
      }

      /*stream.Readable.call(this, streamOpts);*/
      this.chunks = []
    }
  }

  results() {
    return this.chunks.join("")
  }

  _read(size) {}

  _pushString(ev) {
    if (!this.firstPush) {
      this.push("[");
      this.firstPush = true;
    }
    this.push(JSON.stringify(ev, "utf8") + ",\n", "utf8");
  }

  push(chunk) {
    this.chunks.push(chunk)
  }

  // TODO Perhaps figure out getting a trailing ']' without ',]' if helpful.
  //Tracer.prototype._flush = function _flush() {
  //    if (!this._objectMode) {
  //        this.push(']')
  //    }
  //};

  child(fields) {
    return new Tracer({
      parent: this,
      fields: fields
    });
  }

  begin(...args) {
    return this.mkEventFunc("B")(...args);
  }

  end(...args) {
    return this.mkEventFunc("E")(...args);
  }

  completeEvent(startTime, dict) {
    var end = performance.now();
    var ts = Math.round(startTime * 1000 * 1000); // microseconds
    var ev = {ts};
    ev.ph = "X"
    ev.dur = Math.round((end - startTime) * 1000 * 1000);
    for (const k of Object.keys(this.fields)) {
      ev[k] = this.fields[k];
    }
    for (const k of Object.keys(dict)) {
      ev[k] = dict[k];
    }
    this._push(ev)
  }

  instantEvent(...args) {
    return this.mkEventFunc("I")(...args);
  }

  mkEventFunc(ph) {
    return fields => {
      var start = performance.now();
      var ts = Math.round(start * 1000 * 1000); // microseconds
      var ev = {ts};
      ev.ph = ph;
      for (const k of Object.keys(this.fields)) {
        ev[k] = this.fields[k];
      }

      if (fields) {
        if (typeof fields === "string") {
          ev.name = fields;
        } else {
          for (const k of Object.keys(fields)) {
            ev[k] = fields[k];
          }

          if (fields.cat) {
            ev.cat = fields.cat.join(",");
          }
        }
      }
      this._push(ev);
    };
  }
}

/*
 * These correspond to the "Async events" in the Trace Events doc.
 *
 * Required fields:
 * - name
 * - id
 *
 * Optional fields:
 * - cat (array)
 * - args (object)
 * - TODO: stack fields, other optional fields?
 *
 * Dev Note: We don't explicitly assert that correct fields are
 * used for speed (premature optimization alert!).
 */

//module.exports.Tracer = Tracer;
