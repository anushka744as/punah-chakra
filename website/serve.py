# Dev server that disables caching so edits show up on a normal refresh.
import http.server, socketserver

class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(('', 8000), NoCache) as s:
    print('http://localhost:8000')
    s.serve_forever()
