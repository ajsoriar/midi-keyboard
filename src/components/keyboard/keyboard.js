class MidiKeyboard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });

        this.arrayOfAmericanNotes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
        this.arrayOfNotes = ["Do", "Do#", "Re", "Re#", "Mi", "Fa", "Fa#", "Sol", "Sol#", "La", "La#", "Si"];

        this.currentMidiNotes = [];
        this.currentNotes = [];
        this.minMidiNote = 0;
        this.maxMidiNote = 127;
        this.middleCMidiNote = 60;
        this.whiteKeyWidth = 25;

        this.onMIDIMessage = this.onMIDIMessage.bind(this);
    }

    connectedCallback() {
        this.render();
        this.init();
        this.bindKeyboardClicks();
        this.setupMIDI();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    font-size: 13px;
                    font-family: sans-serif;
                    font-weight: 700;
                }

                .status {
                    min-height: 24px;
                    margin-bottom: 8px;
                }

                #keyboard {
                    position: relative;
                    display: block;
                    height: 99px;
                    user-select: none;
                    -webkit-user-select: none;
                    -moz-user-select: none;
                    -ms-user-select: none;
                }

                .key {
                    width: 25px;
                    height: 75px;
                    border: 1px solid black;
                    border-radius: 3px;
                    margin: 0;
                    display: inline-block;
                    cursor: pointer;
                    background-color: #ececec;
                    color: #000;
                    position: absolute;
                    top: 0;
                    left: 0;
                }

                .key:hover {
                    background-color: #00ff00;
                    color: #fff;
                }

                .key span {
                    position: absolute;
                    bottom: 0;
                    width: 100%;
                    text-align: center;
                }

                .blackKey {
                    width: 15px;
                    height: 50px;
                    background-color: #000;
                    color: #fff;
                    margin: 0;
                    border-radius: 0;
                    border: 1px solid black;
                    position: absolute;
                    top: 0;
                    z-index: 1;
                    cursor: pointer;
                    display: inline-block;
                    left: 0;
                    font-size: 10px;
                }

                .blackKey:hover {
                    background-color: #00ff00;
                    color: #000;
                }

                .blackKey span {
                    position: absolute;
                    bottom: 0;
                    width: 100%;
                    text-align: center;
                }

                .activeKey {
                    background-color: blue;
                    color: #fff;
                }

                .middleC {
                    background-color: yellow;
                }

                .middleC.activeKey {
                    background-color: blue;
                    color: #fff;
                }

                .octaveMarker {
                    position: absolute;
                    top: 75px;
                    height: 22px;
                    border: 1px solid black;
                    background-color: #d8e8b0;
                    color: #000;
                    box-sizing: border-box;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 13px;
                    z-index: 0;
                }
            </style>

            <div id="currentMidiNotes" class="status"></div>
            <div id="currentNotes" class="status"></div>
            <div id="keyboard"></div>
        `;
    }

    getNoteFromMidiNote(midiNote) {
        var note = this.arrayOfNotes[midiNote % 12];
        var octave = Math.floor(midiNote / 12) - 1;
        return note + octave;
    }

    getAmericanNoteFromMidiNote(midiNote) {
        var note = this.arrayOfAmericanNotes[midiNote % 12];
        var octave = Math.floor(midiNote / 12) - 1;
        return note + octave;
    }

    addNote(note) {
        if (this.currentMidiNotes.includes(note)) {
            return;
        }

        this.currentMidiNotes.push(note);
        this.currentNotes.push(this.getNoteFromMidiNote(note));
        this.updateStatus();

        var el = this.shadowRoot.getElementById("key" + note);
        if (el) {
            el.classList.add("activeKey");
        }
    }

    removeNote(note) {
        var midiIndex = this.currentMidiNotes.indexOf(note);
        if (midiIndex > -1) {
            this.currentMidiNotes.splice(midiIndex, 1);
        }

        var noteIndex = this.currentNotes.indexOf(this.getNoteFromMidiNote(note));
        if (noteIndex > -1) {
            this.currentNotes.splice(noteIndex, 1);
        }

        this.updateStatus();

        var el = this.shadowRoot.getElementById("key" + note);
        if (el) {
            el.classList.remove("activeKey");
        }
    }

    updateStatus() {
        this.shadowRoot.getElementById("currentMidiNotes").innerHTML = this.currentMidiNotes;
        this.shadowRoot.getElementById("currentNotes").innerHTML = this.currentNotes;
    }

    onMIDIMessage(message) {
        var type = message.data[0];

        if (type !== 248) {
            if (type === 144 && message.data[2] > 0) {
                this.addNote(message.data[1]);
            } else if (type === 128 || (type === 144 && message.data[2] === 0)) {
                this.removeNote(message.data[1]);
            }

            var note = message.data[1];
            var velocity = message.data[2] / 127;
            var time = message.timeStamp;
            var channel = message.data[0] & 0xf;

            console.log("-----> type: " + type);
            console.log("note: " + note + " (" + this.getAmericanNoteFromMidiNote(note) + ")");
            console.log("velocity: " + velocity);
            console.log("time: " + time);
            console.log("channel: " + channel);
        }
    }

    setupMIDI() {
        if (navigator.requestMIDIAccess) {
            navigator.requestMIDIAccess().then(
                (midi) => {
                    var inputs = midi.inputs.values();
                    for (var input = inputs.next(); input && !input.done; input = inputs.next()) {
                        input.value.onmidimessage = this.onMIDIMessage;
                    }
                },
                () => {
                    console.error("No access to your midi devices.");
                }
            );
        } else {
            console.log("Browser does not support MIDI!");
        }
    }

    isBlackNote(midiNote) {
        return this.arrayOfNotes[midiNote % 12].indexOf("#") > -1;
    }

    getWhiteKeyCount(startMidiNote, endMidiNote) {
        var count = 0;

        for (var midiNote = startMidiNote; midiNote <= endMidiNote; midiNote++) {
            if (!this.isBlackNote(midiNote)) {
                count++;
            }
        }

        return count;
    }

    getOctaveMarkersHtml(startMidiNote, endMidiNote) {
        var str = "";
        var W = this.whiteKeyWidth;
        var firstOctave = Math.floor(startMidiNote / 12);
        var lastOctave = Math.floor(endMidiNote / 12);

        for (var octave = firstOctave; octave <= lastOctave; octave++) {
            var octaveStart = Math.max(startMidiNote, octave * 12);
            var octaveEnd = Math.min(endMidiNote, octave * 12 + 11);
            var left = this.getWhiteKeyCount(startMidiNote, octaveStart - 1) * W;
            var width = this.getWhiteKeyCount(octaveStart, octaveEnd) * W;
            var octaveNumber = octave - 1;

            str += "<div class='octaveMarker' style='left:" + left + "px;width:" + width + "px'>" + octaveNumber + "</div>";
        }

        return str;
    }

    getMidiRangeFromOctaves(startOctave, endOctave) {
        return {
            startMidiNote: (startOctave + 1) * 12,
            endMidiNote: Math.min((endOctave + 1) * 12 + 11, this.maxMidiNote)
        };
    }

    getKeyboardHtml(startMidiNote, endMidiNote) {
        var str = "";
        var cont = 0;
        var W = this.whiteKeyWidth;

        for (var noteNumber = startMidiNote; noteNumber <= endMidiNote; noteNumber++) {
            var noteName = this.arrayOfNotes[noteNumber % 12];

            if (this.isBlackNote(noteNumber)) {
                str += "<div class='blackKey' data-note='" + noteNumber + "' id='key" + noteNumber + "' style='left:" + (cont * W - (W / 2 - 2)) + "px'><span>" + noteName + "</span></div>";
            } else {
                var keyClass = noteNumber === this.middleCMidiNote ? "key middleC" : "key";
                str += "<div class='" + keyClass + "' data-note='" + noteNumber + "' id='key" + noteNumber + "' style='left:" + cont * W + "px'><span>" + noteName + "</span></div>";
                cont++;
            }
        }

        str += this.getOctaveMarkersHtml(startMidiNote, endMidiNote);

        return str;
    }

    paintKeyboard(startMidiNote, endMidiNote) {
        var keyboard = this.shadowRoot.getElementById("keyboard");
        keyboard.innerHTML = this.getKeyboardHtml(startMidiNote, endMidiNote);
        keyboard.style.width = (this.getWhiteKeyCount(startMidiNote, endMidiNote) * this.whiteKeyWidth) + "px";
    }

    paintFullKeyboard() {
        this.paintKeyboard(this.minMidiNote, this.maxMidiNote);
    }

    init(startOctave, endOctave) {
        if (startOctave === undefined && endOctave === undefined) {
            this.paintFullKeyboard();
            return;
        }

        if (
            !Number.isInteger(startOctave) ||
            !Number.isInteger(endOctave) ||
            startOctave >= endOctave ||
            startOctave < -1 ||
            endOctave > 9
        ) {
            console.error("Piano.init(startOctave, endOctave) necesita octavas enteras entre -1 y 9, y startOctave debe ser menor que endOctave. Pintando piano completo.");
            this.paintFullKeyboard();
            return;
        }

        var range = this.getMidiRangeFromOctaves(startOctave, endOctave);
        this.paintKeyboard(range.startMidiNote, range.endMidiNote);
    }

    clear() {
        var keyboard = this.shadowRoot.getElementById("keyboard");
        keyboard.innerHTML = "";
        keyboard.style.width = "0";
        this.currentMidiNotes = [];
        this.currentNotes = [];
        this.updateStatus();
    }

    bindKeyboardClicks() {
        this.shadowRoot.getElementById("keyboard").addEventListener("click", (event) => {
            var key = event.target.closest(".key, .blackKey");
            if (!key) {
                return;
            }

            var noteNumber = Number(key.getAttribute("data-note"));
            this.addNote(noteNumber);
        });
    }
}

customElements.define("midi-keyboard", MidiKeyboard);

window.Piano = {
    getElement: function () {
        return document.querySelector("midi-keyboard");
    },

    init: function (startOctave, endOctave) {
        var piano = this.getElement();
        if (!piano) {
            console.error("No se encontro ningun elemento <midi-keyboard>.");
            return;
        }

        piano.init(startOctave, endOctave);
    },

    clear: function () {
        var piano = this.getElement();
        if (!piano) {
            console.error("No se encontro ningun elemento <midi-keyboard>.");
            return;
        }

        piano.clear();
    }
};
