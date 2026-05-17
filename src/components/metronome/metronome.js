class MidiMetronome extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });

        this.bpm = 120;
        this.isRunning = false;
        this.timerId = null;
        this.audioContext = null;
        this.presetBpms = [40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180];

        this.onStartClick = this.onStartClick.bind(this);
        this.onStopClick = this.onStopClick.bind(this);
        this.onPresetClick = this.onPresetClick.bind(this);
    }

    connectedCallback() {
        this.render();
        this.bindEvents();
        this.updateBpmView();
    }

    render() {
        var presetButtonsHtml = this.presetBpms.map(function (presetBpm) {
            return '<button type="button" class="presetButton" data-bpm="' + presetBpm + '">' + presetBpm + '</button>';
        }).join("");

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    position: fixed;
                    top: 12px;
                    left: 12px;
                    z-index: 1000;
                    font-family: sans-serif;
                    color: #111;
                }

                .metronome {
                    width: 130px;
                    background: rgba(255, 255, 255, 0.95);
                    border: 1px solid #333;
                    border-radius: 8px;
                    padding: 8px;
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
                }

                .title {
                    margin: 0 0 6px;
                    font-size: 12px;
                    font-weight: bold;
                    letter-spacing: 0.04em;
                    text-transform: uppercase;
                }

                .bpmValue {
                    font-size: 18px;
                    font-weight: bold;
                    margin-bottom: 8px;
                }

                .controls,
                .presets {
                    display: flex;
                    gap: 6px;
                    flex-wrap: wrap;
                }

                button {
                    border: 1px solid #666;
                    background: #f3f3f3;
                    color: #111;
                    border-radius: 4px;
                    font-size: 12px;
                    line-height: 1;
                    padding: 6px 8px;
                    cursor: pointer;
                }

                button:hover {
                    background: #e6e6e6;
                }

                .startButton {
                    background: #dff2e0;
                }

                .stopButton {
                    background: #f8dddd;
                }

                .status {
                    margin-top: 6px;
                    font-size: 11px;
                    color: #444;
                }
            </style>

            <div class="metronome">
                <p class="title">Metronome</p>
                <div class="bpmValue"><span id="bpmDisplay">120</span> BPM</div>
                <div class="controls">
                    <button type="button" id="startButton" class="startButton">Start</button>
                    <button type="button" id="stopButton" class="stopButton">Stop</button>
                </div>
                <div class="presets">${presetButtonsHtml}</div>
                <div id="status" class="status">Stopped</div>
            </div>
        `;
    }

    bindEvents() {
        var startButton = this.shadowRoot.getElementById("startButton");
        var stopButton = this.shadowRoot.getElementById("stopButton");
        var presetButtons = this.shadowRoot.querySelectorAll(".presetButton");

        startButton.addEventListener("click", this.onStartClick);
        stopButton.addEventListener("click", this.onStopClick);

        for (var i = 0; i < presetButtons.length; i++) {
            presetButtons[i].addEventListener("click", this.onPresetClick);
        }
    }

    onStartClick() {
        this.start();
    }

    onStopClick() {
        this.stop();
    }

    onPresetClick(event) {
        var bpmValue = Number(event.currentTarget.getAttribute("data-bpm"));
        this.setBpm(bpmValue);
    }

    ensureAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        if (this.audioContext.state === "suspended") {
            this.audioContext.resume();
        }
    }

    tick() {
        this.ensureAudioContext();

        var now = this.audioContext.currentTime;
        var oscillator = this.audioContext.createOscillator();
        var gain = this.audioContext.createGain();

        oscillator.type = "square";
        oscillator.frequency.value = 1100;

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.2, now + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

        oscillator.connect(gain);
        gain.connect(this.audioContext.destination);

        oscillator.start(now);
        oscillator.stop(now + 0.07);
    }

    restartIfRunning() {
        if (!this.isRunning) {
            return;
        }

        this.stop();
        this.start();
    }

    updateBpmView() {
        var bpmDisplay = this.shadowRoot.getElementById("bpmDisplay");
        var status = this.shadowRoot.getElementById("status");
        if (!bpmDisplay || !status) {
            return;
        }

        bpmDisplay.textContent = String(this.bpm);
        status.textContent = this.isRunning ? "Running" : "Stopped";
    }

    setBpm(bpm) {
        if (!Number.isFinite(bpm)) {
            return;
        }

        var normalizedBpm = Math.round(bpm);
        if (normalizedBpm < 30 || normalizedBpm > 240) {
            console.error("Metronome BPM must be between 30 and 240.");
            return;
        }

        this.bpm = normalizedBpm;
        this.updateBpmView();
        this.restartIfRunning();
    }

    start() {
        if (this.isRunning) {
            return;
        }

        this.isRunning = true;
        this.updateBpmView();
        this.tick();

        var intervalMs = 60000 / this.bpm;
        this.timerId = window.setInterval(this.tick.bind(this), intervalMs);
    }

    stop() {
        if (this.timerId !== null) {
            window.clearInterval(this.timerId);
            this.timerId = null;
        }

        this.isRunning = false;
        this.updateBpmView();
    }

    init(bpm) {
        if (bpm !== undefined) {
            this.setBpm(bpm);
        } else {
            this.updateBpmView();
        }
    }
}

customElements.define("midi-metronome", MidiMetronome);

window.Metronome = {
    getElement: function () {
        return document.querySelector("midi-metronome");
    },

    init: function (bpm) {
        var metronome = this.getElement();
        if (!metronome) {
            console.error("No <midi-metronome> element found.");
            return;
        }

        metronome.init(bpm);
    },

    start: function () {
        var metronome = this.getElement();
        if (!metronome) {
            console.error("No <midi-metronome> element found.");
            return;
        }

        metronome.start();
    },

    stop: function () {
        var metronome = this.getElement();
        if (!metronome) {
            console.error("No <midi-metronome> element found.");
            return;
        }

        metronome.stop();
    },

    setBpm: function (bpm) {
        var metronome = this.getElement();
        if (!metronome) {
            console.error("No <midi-metronome> element found.");
            return;
        }

        metronome.setBpm(bpm);
    }
};
