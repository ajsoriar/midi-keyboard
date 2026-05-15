class MidiSpeaker extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });

        this.audioContext = null;
        this.output = null;
        this.isEnabled = true;
        this.onPianoNotePressed = this.onPianoNotePressed.bind(this);
        this.onOnClick = this.onOnClick.bind(this);
        this.onOffClick = this.onOffClick.bind(this);
    }

    connectedCallback() {
        this.render();
        this.bindControlEvents();
        this.updatePowerView();
        document.addEventListener("piano-note-pressed", this.onPianoNotePressed);
    }

    disconnectedCallback() {
        document.removeEventListener("piano-note-pressed", this.onPianoNotePressed);
    }

    render() {
        var speakerImageUrl = new URL("../../images/speaker.png", import.meta.url).href;

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    position: fixed;
                    top: 12px;
                    right: 12px;
                    z-index: 1000;
                    display: block;
                    font-family: sans-serif;
                }

                .speaker {
                    width: 120px;
                    height: 120px;
                    border: 1px solid #333;
                    border-radius: 8px;
                    background-color: rgba(255, 255, 255, 0.9);
                    background-image: url("${speakerImageUrl}");
                    background-repeat: no-repeat;
                    background-position: center;
                    background-size: cover;
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
                    display: flex;
                    align-items: flex-end;
                    justify-content: center;
                    overflow: hidden;
                }

                .controls {
                    margin-top: 6px;
                    display: flex;
                    gap: 4px;
                    justify-content: center;
                }

                .powerButton {
                    border: 1px solid #333;
                    border-radius: 4px;
                    background: #f0f0f0;
                    color: #111;
                    font-size: 11px;
                    font-weight: bold;
                    padding: 3px 8px;
                    cursor: pointer;
                }

                .powerButton.active {
                    background: #1f7a1f;
                    color: #fff;
                }

                .speaker.off {
                    filter: grayscale(1);
                    opacity: 0.7;
                }

                .noteLabel {
                    width: 100%;
                    text-align: center;
                    padding: 4px;
                    background: rgba(0, 0, 0, 0.65);
                    color: #fff;
                    font-weight: bold;
                    font-size: 12px;
                    letter-spacing: 0.04em;
                    box-sizing: border-box;
                }

                .speaker.pulse {
                    box-shadow: 0 0 0 2px #00ff00, 0 4px 12px rgba(0, 255, 0, 0.45);
                }
            </style>

            <div id="speaker" class="speaker">
                <div id="noteLabel" class="noteLabel">--</div>
            </div>
            <div class="controls">
                <button id="onButton" class="powerButton" type="button">ON</button>
                <button id="offButton" class="powerButton" type="button">OFF</button>
            </div>
        `;
    }

    bindControlEvents() {
        var onButton = this.shadowRoot.getElementById("onButton");
        var offButton = this.shadowRoot.getElementById("offButton");
        if (!onButton || !offButton) {
            return;
        }

        onButton.addEventListener("click", this.onOnClick);
        offButton.addEventListener("click", this.onOffClick);
    }

    updatePowerView() {
        var speaker = this.shadowRoot.getElementById("speaker");
        var onButton = this.shadowRoot.getElementById("onButton");
        var offButton = this.shadowRoot.getElementById("offButton");
        if (!speaker || !onButton || !offButton) {
            return;
        }

        speaker.classList.toggle("off", !this.isEnabled);
        onButton.classList.toggle("active", this.isEnabled);
        offButton.classList.toggle("active", !this.isEnabled);
    }

    onOnClick() {
        this.setEnabled(true);
    }

    onOffClick() {
        this.setEnabled(false);
    }

    setEnabled(enabled) {
        this.isEnabled = Boolean(enabled);
        this.updatePowerView();
    }

    ensureAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.createOutputChain();
        }

        if (this.audioContext.state === "suspended") {
            this.audioContext.resume();
        }
    }

    createOutputChain() {
        var compressor = this.audioContext.createDynamicsCompressor();
        compressor.threshold.value = -24;
        compressor.knee.value = 24;
        compressor.ratio.value = 8;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.18;
        compressor.connect(this.audioContext.destination);
        this.output = compressor;
    }

    midiToFrequency(midiNote) {
        return 440 * Math.pow(2, (midiNote - 69) / 12);
    }

    playNote(midiNote) {
        if (!Number.isFinite(midiNote)) {
            return;
        }

        this.ensureAudioContext();

        var now = this.audioContext.currentTime;
        var frequency = this.midiToFrequency(midiNote);
        var noteGain = this.audioContext.createGain();
        var filter = this.audioContext.createBiquadFilter();
        var harmonics = [
            { ratio: 1, gain: 0.34, detune: 0, release: 1.45 },
            { ratio: 2, gain: 0.14, detune: 1.5, release: 0.95 },
            { ratio: 3, gain: 0.09, detune: -2, release: 0.72 },
            { ratio: 4, gain: 0.055, detune: 2.5, release: 0.5 },
            { ratio: 5, gain: 0.032, detune: -3, release: 0.34 },
            { ratio: 6, gain: 0.022, detune: 4, release: 0.25 }
        ];
        var duration = 1.7;

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(Math.min(8200, Math.max(1800, frequency * 16)), now);
        filter.frequency.exponentialRampToValueAtTime(Math.min(4200, Math.max(900, frequency * 6)), now + 0.7);
        filter.Q.value = 0.6;

        noteGain.gain.setValueAtTime(0.0001, now);
        noteGain.gain.exponentialRampToValueAtTime(0.75, now + 0.008);
        noteGain.gain.exponentialRampToValueAtTime(0.22, now + 0.12);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        for (var i = 0; i < harmonics.length; i++) {
            this.startPianoPartial(frequency, harmonics[i], now, duration, noteGain);
        }

        this.addHammerNoise(now, frequency, noteGain);

        noteGain.connect(filter);
        filter.connect(this.output);

        window.setTimeout(function () {
            try {
                noteGain.disconnect();
                filter.disconnect();
            } catch (error) {
                // Nodes may already be disconnected by the browser.
            }
        }, Math.ceil((duration + 0.1) * 1000));
    }

    startPianoPartial(frequency, harmonic, now, duration, destination) {
        var oscillator = this.audioContext.createOscillator();
        var gain = this.audioContext.createGain();
        var releaseEnd = Math.min(duration, harmonic.release);

        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(frequency * harmonic.ratio, now);
        oscillator.detune.setValueAtTime(harmonic.detune, now);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(harmonic.gain, now + 0.006);
        gain.gain.exponentialRampToValueAtTime(harmonic.gain * 0.28, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + releaseEnd);

        oscillator.connect(gain);
        gain.connect(destination);
        oscillator.start(now);
        oscillator.stop(now + duration);
    }

    addHammerNoise(now, frequency, destination) {
        var bufferSize = Math.floor(this.audioContext.sampleRate * 0.035);
        var buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        var data = buffer.getChannelData(0);
        var noise = this.audioContext.createBufferSource();
        var noiseGain = this.audioContext.createGain();
        var noiseFilter = this.audioContext.createBiquadFilter();

        for (var i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - (i / bufferSize));
        }

        noise.buffer = buffer;
        noiseFilter.type = "bandpass";
        noiseFilter.frequency.value = Math.min(5200, Math.max(900, frequency * 8));
        noiseFilter.Q.value = 0.8;

        noiseGain.gain.setValueAtTime(0.02, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(destination);
        noise.start(now);
        noise.stop(now + 0.04);
    }

    setNoteLabel(noteName) {
        var label = this.shadowRoot.getElementById("noteLabel");
        if (label) {
            label.textContent = noteName || "--";
        }
    }

    pulse() {
        var speaker = this.shadowRoot.getElementById("speaker");
        if (!speaker) {
            return;
        }

        speaker.classList.remove("pulse");
        window.requestAnimationFrame(function () {
            speaker.classList.add("pulse");
            window.setTimeout(function () {
                speaker.classList.remove("pulse");
            }, 150);
        });
    }

    onPianoNotePressed(event) {
        if (!event || !event.detail) {
            return;
        }

        this.setNoteLabel(event.detail.note);
        if (!this.isEnabled) {
            return;
        }

        this.playNote(event.detail.midiNote);
        this.pulse();
    }

    init() {
        this.render();
        this.bindControlEvents();
        this.updatePowerView();
    }
}

customElements.define("midi-speaker", MidiSpeaker);

window.Speaker = {
    getElement: function () {
        return document.querySelector("midi-speaker");
    },

    init: function () {
        var speaker = this.getElement();
        if (!speaker) {
            console.error("No <midi-speaker> element found.");
            return;
        }

        speaker.init();
    },

    on: function () {
        var speaker = this.getElement();
        if (!speaker) {
            console.error("No <midi-speaker> element found.");
            return;
        }

        speaker.setEnabled(true);
    },

    off: function () {
        var speaker = this.getElement();
        if (!speaker) {
            console.error("No <midi-speaker> element found.");
            return;
        }

        speaker.setEnabled(false);
    }
};
