# Little Worlds original soundtrack

These instrumental compositions were created specifically for Little Worlds, using original note sequences and procedural instrument synthesis. They contain no copied recordings, melodies, external sample packs, or Tiletopia audio. They are part of the free game and require no paid music service.

| Track | Tempo | Bars | Exact loop duration | Arrangement |
| --- | --- | --- | --- | --- |
| Sunny Orchard | 100 BPM | 64 | 153.6 seconds | Marimba theme, plucked string arpeggios, rounded bass, shaker, soft kick and snare |
| Berry Bounce | 112 BPM | 64 | 137.142857 seconds | FM bubble melody, syncopated bass, offbeat synth chords, electronic drums, bell details |
| Moonlit Garden | 84 BPM | 48 | 137.142857 seconds | Soft piano-like melody, broken chords, airy pads, low bass and sparse sparkling bells |

Each track has an original eight-bar theme with answering phrases. Orchestration changes every eight bars, with quieter passages, a bridge, and a fuller return. Instrument tails and stereo reflections wrap around the composition boundary, rather than fading to silence at the loop seam.

## Source and encoding

`scripts/compose-music.py` is the complete reproducible score, synthesis, and rendering source. It uses deterministic NumPy synthesis: additive/inharmonic partials for mallets and keys, decaying harmonics for plucked strings, FM for bubbly synths, detuned sine layers for pads, and generated noise for percussion. No samples are downloaded. Stereo masters are rendered at 32 kHz, softly saturated and normalized, then encoded as 128 kbps stereo MP3s with ffmpeg. Temporary masters do not ship in the app.

Files in `public/music/` are the production assets. Total compressed download is approximately 6.5 MiB. The offline service worker precaches all three, and the game uses full cached responses with Web Audio decoding, avoiding streaming range-request problems. Playback uses an explicit musical loop endpoint and an 800 ms fade in; outgoing tracks fade over 650 ms. At most the current and transitioning track are decoded at once.

## Player preferences

The first welcome chooser requires a track selection before **Let’s play** becomes available, with an optional **Play without music** route. The saved welcome flag prevents repeated onboarding. After a normal reload the saved music starts on the first user interaction, as required by mobile browser autoplay policies. Menu → Music & Sound provides immediate track switching, music volume, Music off, and an independent tile-effect switch. Backgrounding suspends the shared audio context without advancing the song position. Existing game progress and sound/motion settings retain their original storage format.
