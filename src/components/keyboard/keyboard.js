class MidiKeyboard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });

        this.arrayOfAmericanNotes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
        this.arrayOfNotes = ["Do", "Do#", "Re", "Re#", "Mi", "Fa", "Fa#", "Sol", "Sol#", "La", "La#", "Si"];

        this.currentMidiNotes = [];
        this.currentNotes = [];
        this.hoverMidiNotes = [];
        this.minMidiNote = 0;
        this.maxMidiNote = 127;
        this.middleCMidiNote = 60;
        this.whiteKeyWidth = 25;
        this.paintIsOn = true;

        this.onMIDIMessage = this.onMIDIMessage.bind(this);
        this.onKeyboardClick = this.onKeyboardClick.bind(this);
        this.onKeyMouseOver = this.onKeyMouseOver.bind(this);
        this.onKeyMouseOut = this.onKeyMouseOut.bind(this);
        this.onPaintChange = this.onPaintChange.bind(this);
        this.onClearClick = this.onClearClick.bind(this);
        this.onCloseClick = this.onCloseClick.bind(this);
    }

    connectedCallback() {
        this.render();
        this.bindKeyboardClicks();
        this.bindControls();
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
                    position: relative;
                }

                .status {
                    min-height: 24px;
                    margin-bottom: 2px;
                }

                #keyboard {
                    position: relative;
                    display: block;
                    height: 99px;
                    user-select: none;
                    -webkit-user-select: none;
                    -moz-user-select: none;
                    -ms-user-select: none;
                    margin: auto;
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

                .hoverKey {
                    background-color: #00ff00;
                    color: #000;
                    box-shadow: inset 0 0 0 2px #00ff00;
                }

                .activeKey.hoverKey {
                    background-color: blue;
                    color: #fff;
                    box-shadow: inset 0 0 0 2px #00ff00;
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

                #component-controls {
                    position: absolute;
                    top: 0;
                    right: 0;
                    display: flex;
                    gap: 2px;
                    padding: 4px;
                }

                .button {             
                    padding: 2px 4px;
                    border: 2px solid #333;
                    background-color: #f0f0f0;
                    color: #000;
                    border-radius: 1px;
                    cursor: pointer;
                    font-size: 10px;
                }

                .button:hover {
                    background-color: #e0e0e0;
                }

                #hoverToggle {
                    margin: 0 3px 0 0;
                    vertical-align: middle;
                }

                .button label {
                    cursor: pointer;
                }
            </style>

            <div id="currentMidiNotes" class="status"></div>
            <div id="currentNotes" class="status"></div>
            <div id="keyboard"></div>
            <div id="component-controls">
                <div class="button"><input id="hoverToggle" type="checkbox" checked><label for="hoverToggle">Paint</label></div>
                <div id="clear" class="button">Clear</div>
                <div id="close" class="button">X</div>
            </div>
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

    dispatchNoteHoverEvent(eventName, noteNumber) {
        this.dispatchEvent(new CustomEvent(eventName, {
            detail: {
                midiNote: noteNumber,
                note: this.getAmericanNoteFromMidiNote(noteNumber)
            },
            bubbles: true,
            composed: true
        }));
    }

    dispatchNotePressedEvent(noteNumber) {
        this.dispatchEvent(new CustomEvent("piano-note-pressed", {
            detail: {
                midiNote: noteNumber,
                note: this.getAmericanNoteFromMidiNote(noteNumber)
            },
            bubbles: true,
            composed: true
        }));
    }

    getMidiFromNoteName(noteName, skipRangeCheck) {
        if (typeof noteName !== "string") {
            return null;
        }

        var value = noteName.trim();
        if (!value) {
            return null;
        }

        value = value.replace("♯", "#").replace("♭", "b");

        var match = value.match(/^([A-Za-z#b]+)(-?\d+)$/);
        if (!match) {
            return null;
        }

        var rawName = match[1].toLowerCase();
        var octave = Number(match[2]);
        var noteToPitchClass = {
            do: 0,
            "do#": 1,
            dob: 11,
            re: 2,
            "re#": 3,
            reb: 1,
            mi: 4,
            mib: 3,
            fa: 5,
            "fa#": 6,
            fab: 4,
            sol: 7,
            "sol#": 8,
            solb: 6,
            la: 9,
            "la#": 10,
            lab: 8,
            si: 11,
            sib: 10,
            c: 0,
            "c#": 1,
            cb: 11,
            d: 2,
            "d#": 3,
            db: 1,
            e: 4,
            eb: 3,
            f: 5,
            "f#": 6,
            fb: 4,
            g: 7,
            "g#": 8,
            gb: 6,
            a: 9,
            "a#": 10,
            ab: 8,
            b: 11,
            bb: 10
        };
        var pitchClass = noteToPitchClass[rawName];

        if (pitchClass === undefined || !Number.isInteger(octave)) {
            return null;
        }

        var midiNote = (octave + 1) * 12 + pitchClass;
        if (!skipRangeCheck && (midiNote < this.minMidiNote || midiNote > this.maxMidiNote)) {
            return null;
        }

        return midiNote;
    }

    highlightNotes(noteNames) {
        if (!Array.isArray(noteNames)) {
            return;
        }

        for (var i = 0; i < noteNames.length; i++) {
            var midiNote = this.getMidiFromNoteName(noteNames[i]);
            if (midiNote === null) {
                console.error("Piano.highlight: nota invalida -> " + noteNames[i]);
                continue;
            }

            this.addHoverNote(midiNote);
        }
    }

    unhighlightNotes(noteNames) {
        if (!Array.isArray(noteNames)) {
            return;
        }

        if (noteNames.length === 0) {
            var allNotes = this.hoverMidiNotes.slice();
            for (var j = 0; j < allNotes.length; j++) {
                this.removeHoverNote(allNotes[j]);
            }
            return;
        }

        for (var i = 0; i < noteNames.length; i++) {
            var midiNote = this.getMidiFromNoteName(noteNames[i]);
            if (midiNote === null) {
                console.error("Piano.unhighlight: nota invalida -> " + noteNames[i]);
                continue;
            }

            this.removeHoverNote(midiNote);
        }
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

        this.dispatchNotePressedEvent(note);
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

    addHoverNote(note) {
        if (!this.hoverMidiNotes.includes(note)) {
            this.hoverMidiNotes.push(note);
        }

        var el = this.shadowRoot.getElementById("key" + note);
        if (el) {
            el.classList.add("hoverKey");
        }
    }

    removeHoverNote(note) {
        var index = this.hoverMidiNotes.indexOf(note);
        if (index > -1) {
            this.hoverMidiNotes.splice(index, 1);
        }

        var el = this.shadowRoot.getElementById("key" + note);
        if (el) {
            el.classList.remove("hoverKey");
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

    isValidMidiRange(startMidiNote, endMidiNote) {
        return Number.isInteger(startMidiNote) &&
            Number.isInteger(endMidiNote) &&
            startMidiNote >= this.minMidiNote &&
            endMidiNote <= this.maxMidiNote &&
            startMidiNote < endMidiNote;
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
        for (var i = 0; i < this.hoverMidiNotes.length; i++) {
            this.addHoverNote(this.hoverMidiNotes[i]);
        }
    }

    paintFullKeyboard() {
        this.paintKeyboard(this.minMidiNote, this.maxMidiNote);
    }

    initOctave(startOctave, endOctave) {
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
            console.error("Piano.initOctave(startOctave, endOctave) necesita octavas enteras entre -1 y 9, y startOctave debe ser menor que endOctave. Pintando piano completo.");
            this.paintFullKeyboard();
            return;
        }

        var range = this.getMidiRangeFromOctaves(startOctave, endOctave);
        this.initMidi(range.startMidiNote, range.endMidiNote);
    }

    initMidi(startMidiNote, endMidiNote) {
        if (!this.isValidMidiRange(startMidiNote, endMidiNote)) {
            console.error("Piano.initMidi(startMidiNote, endMidiNote) necesita notas MIDI enteras entre 0 y 127, y startMidiNote debe ser menor que endMidiNote. Pintando piano completo.");
            this.paintFullKeyboard();
            return;
        }

        this.paintKeyboard(startMidiNote, endMidiNote);
    }

    initRange(startNoteName, endNoteName) {
        var startMidiNote = this.getMidiFromNoteName(startNoteName, true);
        var endMidiNote = this.getMidiFromNoteName(endNoteName, true);

        if (startMidiNote === null || endMidiNote === null) {
            console.error("Piano.initRange(startNoteName, endNoteName) necesita notas validas, por ejemplo \"A0\" y \"C8\". Pintando piano completo.");
            this.paintFullKeyboard();
            return;
        }

        this.initMidi(startMidiNote, endMidiNote);
    }

    init(startOctave, endOctave) {
        this.initOctave(startOctave, endOctave);
    }

    clear() {
        this.currentMidiNotes = [];
        this.currentNotes = [];
        this.updateStatus();

        var activeKeys = this.shadowRoot.querySelectorAll(".activeKey");
        for (var i = 0; i < activeKeys.length; i++) {
            activeKeys[i].classList.remove("activeKey");
        }
    }

    destroy() {
        this.currentMidiNotes = [];
        this.currentNotes = [];
        this.hoverMidiNotes = [];

        if (this.parentNode) {
            this.parentNode.removeChild(this);
        }
    }

    getEventKey(event) {
        var key = event.target.closest(".key, .blackKey");
        if (!key || !this.shadowRoot.getElementById("keyboard").contains(key)) {
            return null;
        }

        return key;
    }

    onKeyboardClick(event) {
        if (!this.paintIsOn) {
            return;
        }

        var key = this.getEventKey(event);
        if (!key) {
            return;
        }

        this.addNote(Number(key.getAttribute("data-note")));
    }

    onKeyMouseOver(event) {
        var key = this.getEventKey(event);
        if (!key || key.contains(event.relatedTarget)) {
            return;
        }

        this.dispatchNoteHoverEvent("piano-note-hover", Number(key.getAttribute("data-note")));
    }

    onKeyMouseOut(event) {
        var key = this.getEventKey(event);
        if (!key || key.contains(event.relatedTarget)) {
            return;
        }

        this.dispatchNoteHoverEvent("piano-note-unhover", Number(key.getAttribute("data-note")));
    }

    bindKeyboardClicks() {
        var keyboard = this.shadowRoot.getElementById("keyboard");
        keyboard.addEventListener("click", this.onKeyboardClick);
        keyboard.addEventListener("mouseover", this.onKeyMouseOver);
        keyboard.addEventListener("mouseout", this.onKeyMouseOut);
    }

    onPaintChange(event) {
        this.paintIsOn = event.currentTarget.checked;
    }

    onClearClick() {
        this.clear();
    }

    onCloseClick() {
        this.destroy();
    }

    bindControls() {
        var paintToggle = this.shadowRoot.getElementById("hoverToggle");
        var clearButton = this.shadowRoot.getElementById("clear");
        var closeButton = this.shadowRoot.getElementById("close");

        if (paintToggle) {
            this.paintIsOn = paintToggle.checked;
            paintToggle.addEventListener("change", this.onPaintChange);
        }

        if (clearButton) {
            clearButton.addEventListener("click", this.onClearClick);
        }

        if (closeButton) {
            closeButton.addEventListener("click", this.onCloseClick);
        }
    }
}

customElements.define("midi-keyboard", MidiKeyboard);

window.Piano = {
    getElement: function () {
        return document.querySelector("midi-keyboard");
    },

    normalizeNotes: function (notes) {
        if (Array.isArray(notes)) {
            return notes;
        }

        if (typeof notes === "string") {
            return notes.split(",").map(function (note) {
                return note.trim();
            }).filter(function (note) {
                return note.length > 0;
            });
        }

        return [];
    },

    initOctave: function (startOctave, endOctave) {
        var piano = this.getElement();
        if (!piano) {
            console.error("No se encontro ningun elemento <midi-keyboard>.");
            return;
        }

        piano.initOctave(startOctave, endOctave);
    },

    initMidi: function (startMidiNote, endMidiNote) {
        var piano = this.getElement();
        if (!piano) {
            console.error("No se encontro ningun elemento <midi-keyboard>.");
            return;
        }

        piano.initMidi(startMidiNote, endMidiNote);
    },

    initRange: function (startNoteName, endNoteName) {
        var piano = this.getElement();
        if (!piano) {
            console.error("No se encontro ningun elemento <midi-keyboard>.");
            return;
        }

        piano.initRange(startNoteName, endNoteName);
    },

    init: function (startOctave, endOctave) {
        this.initOctave(startOctave, endOctave);
    },

    clear: function () {
        var piano = this.getElement();
        if (!piano) {
            console.error("No se encontro ningun elemento <midi-keyboard>.");
            return;
        }

        piano.clear();
    },

    destroy: function () {
        var piano = this.getElement();
        if (!piano) {
            console.error("No se encontro ningun elemento <midi-keyboard>.");
            return;
        }

        piano.destroy();
    },

    highlight: function (notes) {
        var piano = this.getElement();
        if (!piano) {
            console.error("No se encontro ningun elemento <midi-keyboard>.");
            return;
        }

        piano.highlightNotes(this.normalizeNotes(notes));
    },

    unhighlight: function (notes) {
        var piano = this.getElement();
        if (!piano) {
            console.error("No se encontro ningun elemento <midi-keyboard>.");
            return;
        }

        piano.unhighlightNotes(this.normalizeNotes(notes));
    }
};
