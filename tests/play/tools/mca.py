import os, zlib, struct, io
import numpy as np
import nbtlib

class World:
    def __init__(self, regiondir):
        self.dir = regiondir; self.files = {}; self.chunks = {}
    def _file(self, rx, rz):
        k = (rx, rz)
        if k not in self.files:
            p = os.path.join(self.dir, f"r.{rx}.{rz}.mca")
            self.files[k] = open(p, 'rb').read() if os.path.exists(p) else None
        return self.files[k]
    def chunk_keys(self):
        out = []
        for f in os.listdir(self.dir):
            if f.startswith('r.') and f.endswith('.mca'):
                _, rx, rz, _ = f.split('.')
                d = self._file(int(rx), int(rz))
                for i in range(1024):
                    if d and int.from_bytes(d[4*i:4*i+3], 'big'):
                        out.append((int(rx)*32 + (i & 31), int(rz)*32 + (i >> 5)))
        return out
    def chunk(self, cx, cz):
        k = (cx, cz)
        if k in self.chunks: return self.chunks[k]
        data = self._file(cx >> 5, cz >> 5); res = None
        if data:
            i = 4 * ((cx & 31) + (cz & 31) * 32)
            off = int.from_bytes(data[i:i+3], 'big')
            if off:
                o = off * 4096
                ln = struct.unpack('>i', data[o:o+4])[0]; comp = data[o+4]
                raw = data[o+5:o+4+ln]
                raw = zlib.decompress(raw) if comp == 2 else raw
                res = self._decode(nbtlib.File.parse(io.BytesIO(raw)))
        self.chunks[k] = res
        return res
    def _decode(self, root):
        secs = {}
        for s in root['sections']:
            y = int(s['Y']); bs = s.get('block_states')
            if bs is None: continue
            pal = []
            for p in bs['palette']:
                props = {str(k): str(v) for k, v in p.get('Properties', {}).items()}
                pal.append((str(p['Name']), props))
            if len(pal) == 1 or 'data' not in bs:
                secs[y] = (pal, None)
            else:
                longs = np.array([int(v) for v in bs['data']], dtype=np.int64).astype(np.uint64)
                bits = max(4, (len(pal) - 1).bit_length()); per = 64 // bits
                mask = np.uint64((1 << bits) - 1)
                idx = np.empty(len(longs) * per, dtype=np.int32)
                for j in range(per):
                    idx[j::per] = ((longs >> np.uint64(j * bits)) & mask).astype(np.int32)
                secs[y] = (pal, idx[:4096])
        return secs
    def get(self, x, y, z):
        c = self.chunk(x >> 4, z >> 4)
        if c is None: return ('minecraft:air', {})
        s = c.get(y >> 4)
        if s is None: return ('minecraft:air', {})
        if s[1] is None: return s[0][0]
        return s[0][s[1][((y & 15) << 8) | ((z & 15) << 4) | (x & 15)]]
    def name(self, x, y, z):
        return self.get(x, y, z)[0].replace('minecraft:', '')
