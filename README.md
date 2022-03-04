trace-event: A library for creating trace event logs of program
execution according to [Google's Trace Event
format](https://docs.google.com/document/d/1CvAClvFfyA5R-PhYUmn5OOQtYMH4h6I0nSsKchNAySU).
These logs can then be visualized with
[ui.perfetto.dev](https://ui.perfetto.dev/) to grok one's programs.


# Usage

TODO

```javascript
var trace = new Trace();
trace.begin({ name: "myname", id: "some-id" });
trace.end({ name: "myname", id: "some-id" });
```

# Links

* https://github.com/google/trace-viewer/wiki
* https://docs.google.com/document/d/1CvAClvFfyA5R-PhYUmn5OOQtYMH4h6I0nSsKchNAySU
* TODO: read https://github.com/natduca/py_trace_event
* https://github.com/google/trace-viewer

# License

MIT. See LICENSE.txt.
