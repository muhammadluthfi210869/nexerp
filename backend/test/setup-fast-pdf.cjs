// The PDF engine renders documents with a real Chromium via html-pdf-node. Unit and e2e
// suites run without one, so they opt into the deterministic single-page engine here.
//
// It used to be implied by NODE_ENV === 'test', and that is exactly how a production defect
// hid: on the server the browser binary does not exist, html-pdf-node threw, the engine
// swallowed the error and returned a one-line placeholder — so every "Download PDF" gave a
// valid PDF containing "NEX ERP Fallback Document Snapshot" with HTTP 200 and no warning.
// A stub has to be asked for explicitly, never assumed from the environment.
process.env.FAST_PDF = '1';
