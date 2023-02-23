#!/usr/bin/env python3
# Simple Python 3 HTTP server for logging all GET and POST requests
# Source: https://gist.github.com/mdonkers/63e115cc0c79b4f6b8b3a6b797e485c7

from http.server import BaseHTTPRequestHandler, HTTPServer
import logging

class HTTPRequestHandler(BaseHTTPRequestHandler):
    def _set_response(self):
        self.send_response(200)
        self.send_header("Content-type", "text/html")
        self.end_headers()

    def do_GET(self):
        self._set_response()

    def do_POST(self):
        content_length = int(self.headers["Content-Length"])
        post_data = self.rfile.read(content_length)
        logging.info("Body\n%s\n", post_data.decode("utf-8"))
        self._set_response();

logging.basicConfig(level=logging.INFO)

with HTTPServer(("", 8000), HTTPRequestHandler) as server:
    server.serve_forever()
