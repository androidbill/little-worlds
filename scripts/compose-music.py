"""Original Little Worlds soundtrack. No samples or third-party melodies.

Requires Python + NumPy and ffmpeg on PATH. Run from any directory:
  python scripts/compose-music.py --scratch /path/to/temporary/masters
The stereo masters stay in scratch; only compressed MP3s ship in public/music.
"""
from pathlib import Path
import argparse
import math
import subprocess
import wave
import numpy as np

SR = 32000
ROOT = Path(__file__).resolve().parents[1]
RNG = np.random.default_rng(20261020)
CACHE = {}


def instrument(name, midi, seconds):
    key = (name, midi, round(seconds, 3))
    if key in CACHE:
        return CACHE[key]
    t = np.arange(int(seconds * SR), dtype=np.float32) / SR
    f = 440 * 2 ** ((midi - 69) / 12)
    w = 2 * np.pi * f * t
    if name == 'marimba':
        x = (np.sin(w) * np.exp(-t * 4.1) + .25 * np.sin(w * 3.99) * np.exp(-t * 11)
             + .08 * np.sin(w * 9.1) * np.exp(-t * 20))
    elif name == 'guitar':
        x = sum((.72 ** (h - 1) / h) * np.sin(w * h + .06 * h)
                * np.exp(-t * (2.8 + h * .8)) for h in range(1, 9))
        x += .025 * RNG.normal(size=len(t)) * np.exp(-t * 65)
    elif name == 'piano':
        x = sum((.67 ** (h - 1)) * np.sin(w * h * (1 + h * h * .000018))
                * np.exp(-t * (1.4 + h * .45)) for h in range(1, 7))
        x += .12 * np.sin(w * 1.0018) * np.exp(-t * 2.2)
    elif name == 'bubble':
        x = np.sin(w + 1.25 * np.sin(w * 2) * np.exp(-t * 13)) * np.exp(-t * 5)
        x += .14 * np.sin(w * 2.002) * np.exp(-t * 9)
    elif name == 'bell':
        x = (np.sin(w) + .23 * np.sin(w * 2.76) + .08 * np.sin(w * 5.4)) * np.exp(-t * 2.7)
    elif name == 'pad':
        x = (.55 * np.sin(w) + .22 * np.sin(w * 1.002) + .15 * np.sin(w * .998)
             + .08 * np.sin(w * 2)) * np.sin(np.pi * np.minimum(t / seconds, 1)) ** 1.3
    elif name == 'bass':
        x = (np.sin(w) + .22 * np.sin(w * 2) + .07 * np.sin(w * 3)) * np.exp(-t * 2.9)
    elif name == 'kick':
        x = np.sin(2 * np.pi * (49 * t + 3.8 * (1 - np.exp(-t * 22)))) * np.exp(-t * 14)
        x += .055 * RNG.normal(size=len(t)) * np.exp(-t * 100)
    elif name == 'snare':
        noise = RNG.normal(size=len(t))
        x = (.65 * (noise - np.roll(noise, 1)) + .28 * np.sin(2 * np.pi * 185 * t)) * np.exp(-t * 25)
    elif name == 'hat':
        noise = RNG.normal(size=len(t))
        x = (noise - np.roll(noise, 1)) * np.exp(-t * 75) * .7
    elif name == 'shaker':
        noise = RNG.normal(size=len(t))
        x = (noise - np.roll(noise, 1)) * np.sin(np.pi * np.minimum(t / .09, 1)) ** 2 * np.exp(-t * 42)
    else:
        raise ValueError(name)
    # Soft attacks and releases avoid clicks even on short notes.
    x *= np.minimum(t / .006, 1) * np.minimum((seconds - t) / .045, 1)
    CACHE[key] = x.astype(np.float32)
    return CACHE[key]


def compose(slug, bpm, bars, chords, mood, scratch):
    beat = 60 / bpm
    length = round(bars * 4 * beat * SR)
    mix = np.zeros((length, 2), dtype=np.float32)

    def note(name, pitch, pos, dur, amp, pan=0):
        sample = instrument(name, pitch, dur)
        at = round(pos * beat * SR) % length
        gains = np.array([math.cos((pan + 1) * math.pi / 4), math.sin((pan + 1) * math.pi / 4)]) * amp
        # Wrap reverb/note tails into the beginning for an actual seamless loop.
        end = min(length - at, len(sample))
        mix[at:at + end] += sample[:end, None] * gains
        if end < len(sample):
            mix[:len(sample) - end] += sample[end:, None] * gains

    # Original eight-bar themes, with a second answering phrase and a bridge.
    themes = {
        'sunny': [[4, 7, 9, 7, 4], [2, 4, 7, 4], [0, 4, 2, 0, -3], [2, 4, 7, 9],
                  [7, 11, 9, 7, 4], [2, 7, 4, 2], [4, 2, 0, 2, 4], [7, 4, 2, 0]],
        'berry': [[7, 7, 9, 12, 9], [4, 7, 4, 2], [0, 4, 7, 9, 7], [2, 4, 2, -1],
                  [7, 12, 14, 12, 9], [7, 4, 7, 9], [4, 2, 0, 4, 7], [4, 2, -1, 2]],
        'moon': [[7, 11, 14], [12, 7, 4], [9, 12, 16], [14, 9, 7],
                 [11, 14, 19], [16, 12, 7], [9, 7, 4], [2, 7, 11]],
    }
    for bar in range(bars):
        root, chord = chords[bar % len(chords)]
        pos = bar * 4
        section = bar // 8
        sparse = section in (0, 4)
        bridge = section == 5
        # Deliberately rotate accompaniment and orchestration every eight bars.
        pad_amp = .047 if mood != 'berry' else .033
        for k, pitch in enumerate(chord[:3]):
            note('pad', pitch + (12 if mood == 'moon' else 0), pos, beat * 4.2, pad_amp, (k - 1) * .48)
        if mood == 'sunny':
            for i, p in enumerate([0, 1, 2, 1, 0, 2]):
                note('guitar', chord[p] + (12 if i % 3 == 2 else 0), pos + i * .5 + .04,
                     1.4, .105 if sparse else .13, -.32)
            note('bass', root - 12, pos, 1.1, .19, 0)
            note('bass', root - 5, pos + 2.5, .7, .12, 0)
            for b in range(8):
                note('shaker', 0, pos + b * .5, .13, .016 if b % 2 else .025, .45)
            if not sparse:
                note('kick', 0, pos, .4, .095)
                note('snare', 0, pos + 2, .22, .025, -.2)
        elif mood == 'berry':
            for b in [0, 1.5, 2, 3.5]:
                note('bass', root - 12 + (12 if b == 3.5 else 0), pos + b, .42, .23)
            for b in range(4):
                if not sparse or b % 2 == 0:
                    note('kick', 0, pos + b, .4, .19)
                if b % 2 and not sparse:
                    note('snare', 0, pos + b, .22, .052, -.12)
                note('hat', 0, pos + b + .5, .1, .032, .4)
                for i, p in enumerate(chord[:3]):
                    note('bubble', p, pos + b + .5 + i * .012, .43, .053, (i - 1) * .4)
            if section in (2, 3, 6, 7):
                for b in range(8):
                    note('bell', chord[b % 3] + 12, pos + b * .5, .7, .022, -.5)
        else:
            note('bass', root - 12, pos, 2.2, .13)
            for i, p in enumerate([0, 2, 1, 2]):
                note('piano', chord[p], pos + i + .035, 2.5, .105, -.32)
            if not sparse:
                note('shaker', 0, pos + 1.5, .15, .014, .5)
                note('shaker', 0, pos + 3.5, .15, .014, .5)
            if section in (2, 3, 6, 7):
                note('bell', chord[1] + 24, pos + 3, 2, .027, .5)

        phrase = themes[mood][bar % 8]
        if bridge:
            phrase = list(reversed(themes[mood][(bar + 2) % 8]))
        if mood == 'moon':
            onsets = [.25, 1.75, 3]
            lead = 'piano'
            base_pitch = 60
            amp = .12
        else:
            onsets = [0, .75, 1.5, 2.5, 3.25][:len(phrase)]
            lead = 'marimba' if mood == 'sunny' else 'bubble'
            base_pitch = 60 if mood == 'sunny' else 62
            amp = .18 if mood == 'sunny' else .145
        # A quieter opening, open bridge, then a fuller return.
        for i, interval in enumerate(phrase):
            if sparse and bar % 2 == 1 and i == len(phrase) - 1:
                continue
            pitch = base_pitch + interval
            note(lead, pitch, pos + onsets[i], 1.65 if mood == 'moon' else 1.15,
                 amp * (.8 if sparse else 1) * (1 if i % 2 == 0 else .86), .16)
            if section in (3, 7) and i in (0, 3):
                note('bell', pitch + 12, pos + onsets[i], 1.25, .025, .5)

    # Stereo early reflections, all circular so the last bar joins the first.
    dry = mix.copy()
    for delay, level, cross in [(.117, .09, True), (.237, .065, False), (.361, .045, True),
                                 (.503, .03, False), (.719, .021, True)]:
        mix += np.roll(dry[:, ::-1] if cross else dry, round(delay * SR), axis=0) * level
    mix -= mix.mean(axis=0)
    rms = float(np.sqrt(np.mean(mix ** 2)))
    mix *= .12 / max(rms, .001)
    mix = np.tanh(mix * 1.15)
    mix *= .84 / max(float(np.max(np.abs(mix))), .001)
    scratch.mkdir(parents=True, exist_ok=True)
    master = scratch / f'{slug}.wav'
    with wave.open(str(master), 'wb') as output:
        output.setnchannels(2)
        output.setsampwidth(2)
        output.setframerate(SR)
        output.writeframes((mix * 32767).astype('<i2').tobytes())
    destination = ROOT / 'public' / 'music' / f'{slug}.mp3'
    destination.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-i', str(master),
                    '-codec:a', 'libmp3lame', '-b:a', '128k', '-ar', str(SR),
                    '-metadata', f'title={slug.replace("-", " ").title()}',
                    '-metadata', 'artist=Little Worlds', str(destination)], check=True)
    print(f'{slug}: {length / SR:.3f}s, {destination.stat().st_size / 1048576:.2f} MiB', flush=True)
    CACHE.clear()


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--scratch', type=Path, required=True)
    args = parser.parse_args()
    compose('sunny-orchard', 100, 64,
            [(48, [60,64,67,71]), (43, [59,62,67,69]), (45, [60,64,69,71]), (41, [57,60,65,67]),
             (48, [60,64,67,71]), (43, [59,62,67,69]), (41, [57,60,65,69]), (43, [59,62,67,69])], 'sunny', args.scratch)
    compose('berry-bounce', 112, 64,
            [(50, [62,66,69,73]), (45, [61,64,69,71]), (47, [62,66,71,73]), (43, [59,62,67,69]),
             (50, [62,66,69,73]), (45, [61,64,69,71]), (43, [59,62,67,71]), (45, [61,64,69,71])], 'berry', args.scratch)
    compose('moonlit-garden', 84, 48,
            [(48, [60,64,67,71]), (45, [60,64,69,71]), (41, [57,60,65,69]), (43, [59,62,67,69]),
             (48, [60,64,67,71]), (40, [59,64,67,71]), (41, [57,60,65,69]), (43, [59,62,67,71])], 'moon', args.scratch)
