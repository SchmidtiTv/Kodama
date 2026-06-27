// A seekable HTTP audio source for symphonia: progressive playback without downloading the
// whole file first. Reads sequentially over one connection; on seek (symphonia jumping to the
// mp4 `moov` atom, or a user scrub) it re-opens with a `Range:` request. The upstream (a local
// proxy → googlevideo) supports byte ranges, so this gives fast start while keeping playback in
// the Rust audio process (so OBS Application Audio Capture + the Rust visualizer still work).
//
// The reqwest Response isn't Sync, but symphonia's MediaSource requires Send + Sync, so the
// mutable bits live behind a Mutex (only ever touched from the single decoder thread anyway).
use std::io::{self, Read, Seek, SeekFrom};
use std::sync::Mutex;

use symphonia::core::io::MediaSource;

pub struct HttpStream {
    url: String,
    client: reqwest::blocking::Client,
    inner: Mutex<Inner>,
}

struct Inner {
    pos: u64,
    len: Option<u64>,
    reader: Option<reqwest::blocking::Response>,
}

impl HttpStream {
    pub fn new(url: String) -> io::Result<Self> {
        let client = reqwest::blocking::Client::builder()
            .timeout(std::time::Duration::from_secs(60))
            .build()
            .map_err(|e| io::Error::new(io::ErrorKind::Other, e))?;
        let s = HttpStream {
            url,
            client,
            inner: Mutex::new(Inner { pos: 0, len: None, reader: None }),
        };
        s.open_at(0)?;
        Ok(s)
    }

    fn open_at(&self, pos: u64) -> io::Result<()> {
        let resp = self
            .client
            .get(&self.url)
            .header(reqwest::header::RANGE, format!("bytes={}-", pos))
            .send()
            .map_err(|e| io::Error::new(io::ErrorKind::Other, e))?;
        let status = resp.status();
        if !(status.is_success() || status.as_u16() == 206) {
            return Err(io::Error::new(io::ErrorKind::Other, format!("HTTP {}", status)));
        }
        let mut inner = self.inner.lock().unwrap();
        if inner.len.is_none() {
            // Prefer the total from `Content-Range: bytes start-end/total`; fall back to
            // Content-Length on a from-zero request.
            if let Some(total) = resp
                .headers()
                .get(reqwest::header::CONTENT_RANGE)
                .and_then(|v| v.to_str().ok())
                .and_then(|s| s.rsplit('/').next().map(str::trim))
                .and_then(|t| t.parse::<u64>().ok())
            {
                inner.len = Some(total);
            } else if pos == 0 {
                inner.len = resp.content_length();
            }
        }
        inner.pos = pos;
        inner.reader = Some(resp);
        Ok(())
    }
}

impl Read for HttpStream {
    fn read(&mut self, buf: &mut [u8]) -> io::Result<usize> {
        let mut inner = self.inner.lock().unwrap();
        let n = match inner.reader.as_mut() {
            Some(r) => r.read(buf)?,
            None => 0,
        };
        inner.pos += n as u64;
        Ok(n)
    }
}

impl Seek for HttpStream {
    fn seek(&mut self, from: SeekFrom) -> io::Result<u64> {
        let (pos, len) = {
            let inner = self.inner.lock().unwrap();
            (inner.pos, inner.len)
        };
        let target = match from {
            SeekFrom::Start(p) => p,
            SeekFrom::Current(d) => (pos as i64 + d).max(0) as u64,
            SeekFrom::End(d) => {
                let l = len.ok_or_else(|| io::Error::new(io::ErrorKind::Other, "unknown length"))?;
                (l as i64 + d).max(0) as u64
            }
        };
        if target != pos {
            self.open_at(target)?;
        }
        Ok(target)
    }
}

impl MediaSource for HttpStream {
    fn is_seekable(&self) -> bool {
        true
    }
    fn byte_len(&self) -> Option<u64> {
        self.inner.lock().unwrap().len
    }
}
