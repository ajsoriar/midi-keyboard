class MidiSpeaker extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });

        this.audioContext = null;
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
        }

        if (this.audioContext.state === "suspended") {
            this.audioContext.resume();
        }
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
        var oscillator = this.audioContext.createOscillator();
        var gain = this.audioContext.createGain();

        oscillator.type = "sine";
        oscillator.frequency.value = this.midiToFrequency(midiNote);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

        oscillator.connect(gain);
        gain.connect(this.audioContext.destination);

        oscillator.start(now);
        oscillator.stop(now + 0.26);
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
