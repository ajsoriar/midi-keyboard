class StaffComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });

        this.arrayOfAmericanNotes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
        this.arrayOfNotes = ["Do", "Do#", "Re", "Re#", "Mi", "Fa", "Fa#", "Sol", "Sol#", "La", "La#", "Si"];

        this.currentMidiNotes = [];
        this.hoverMidiNotes = [];
        this.startOctave = 0;
        this.endOctave = 8;
        this.minMidiNote = 0;
        this.maxMidiNote = 127;
        this.middleCMidiNote = 60;
        this.clef = "SOL";
        this.lineSpacing = 10;
        this.guideLineCount = 4;
        this.noteSpacing = 25;
        this.leftPadding = 50;
        this.noteSize = 20;
        this.verticalPadding = 20;
        this.staffOffset = 0;

        this.onMIDIMessage = this.onMIDIMessage.bind(this);
        this.onNoteClick = this.onNoteClick.bind(this);
        this.onNoteMouseOver = this.onNoteMouseOver.bind(this);
        this.onNoteMouseOut = this.onNoteMouseOut.bind(this);
    }

    getClefConfig() {
        var clefs = {
            SOL: {
                symbol: "&#119070;",
                anchorMidiNote: 67,
                anchorLineIndex: 3,
                topOffset: -1
            },
            FA: {
                symbol: "&#119074;",
                anchorMidiNote: 53,
                anchorLineIndex: 1,
                topOffset: -0.5
            },
            DO: {
                symbol: "&#119073;",
                anchorMidiNote: 60,
                anchorLineIndex: 2,
                topOffset: 0
            }
        };

        return clefs[this.clef] || clefs.SOL;
    }

    connectedCallback() {
        this.render();
        this.setupMIDI();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    font-size: 14px;
                    font-family: sans-serif;
                }

                .status {
                    min-height: 24px;
                    margin-bottom: 8px;
                }

                #staffContainer {
                    position: relative;
                    margin: 0 0;
                    overflow-x: auto;
                    border: 1px solid #795548;
                    overflow-y: hidden;
                    background-color: #9E9E9E;
                }

                .staff {
                    position: relative;
                    width: 100%;
                    margin-bottom: 0px;
                }

                .staffLine {
                    position: absolute;
                    left: 0;
                    width: 100%;
                    height: 1px;
                }

                .staffLine.main {
                    background-color: #000;
                }

                .staffLine.guide {
                    background-color: #808080;
                }

                .clef {
                    position: absolute;
                    left: 10px;
                    font-size: 56px;
                    line-height: 1;
                    z-index: 1;
                }

                .octaveLabel {
                    position: absolute;
                    left: 50px;
                    font-size: 12px;
                    font-weight: bold;
                }

                .noteContainer {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 100%;
                }

                .note {
                    position: absolute;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background-color: #fff;
                    border: 1px solid #fff;
                    box-sizing: border-box;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 8px;
                    color: #000;
                    z-index: 2;
                }

                .note.accidental {
                    background-color: #000;
                    border-color: #000;
                    color: #fff;
                }

                .note.middleC {
                    background-color: yellow;
                    border-color: yellow;
                    color: #000;
                }

                .note.active {
                    background-color: #0000ff;
                    color: #ffffff;
                    box-shadow: 0 0 8px rgba(0, 255, 255, 0.6);
                }

                .note.hover {
                    background-color: #00ff00;
                    border-color: #00ff00;
                    color: #000;
                    box-shadow: 0 0 8px rgba(0, 255, 0, 0.6);
                }

                .note.active.hover {
                    background-color: #0000ff;
                    border-color: #00ff00;
                    color: #ffffff;
                    box-shadow: 0 0 0 2px #00ff00, 0 0 8px rgba(0, 255, 255, 0.6);
                }

                .status{
                    position: absolute;
                    z-index: 100;
                    padding: 7px;
                    font-size: 18px;
                    font-weight: bold;
                }
            </style>

            <div id="currentMidiNotes" class="status"></div>
            <div id="staffContainer"></div>
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
            var midiNote = this.getMidiFromNoteName(noteNames[i], true);
            if (midiNote === null) {
                console.warn("Staff.highlight: invalid note -> " + noteNames[i]);
                continue;
            }

            if (midiNote < this.minMidiNote || midiNote > this.maxMidiNote) {
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
            var midiNote = this.getMidiFromNoteName(noteNames[i], true);
            if (midiNote === null) {
                console.warn("Staff.unhighlight: invalid note -> " + noteNames[i]);
                continue;
            }

            if (midiNote < this.minMidiNote || midiNote > this.maxMidiNote) {
                continue;
            }

            this.removeHoverNote(midiNote);
        }
    }

    getStaffTop() {
        return this.staffOffset + this.guideLineCount * this.lineSpacing;
    }

    getStaffBottom() {
        return this.getStaffTop() + (this.lineSpacing * 4);
    }

    getStaffHeight() {
        var lowestNotePosition = this.staffOffset + this.getRawPositionForNote(this.minMidiNote);
        var guideBottom = this.getStaffBottom() + (this.guideLineCount * this.lineSpacing);
        var contentBottom = Math.max(lowestNotePosition + (this.noteSize / 2), guideBottom);

        return contentBottom + this.verticalPadding;
    }

    getStaffWidth() {
        return this.leftPadding + ((this.maxMidiNote - this.minMidiNote + 1) * this.noteSpacing) + 24;
    }

    getDiatonicStepFromMidiNote(midiNote) {
        var pitchClass = midiNote % 12;
        var octave = Math.floor(midiNote / 12) - 1;
        var naturalStepByPitchClass = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];

        return (octave * 7) + naturalStepByPitchClass[pitchClass];
    }

    getRawPositionForNote(midiNote) {
        var clefConfig = this.getClefConfig();
        var pixelsPerDiatonicStep = this.lineSpacing / 2;
        var anchorPosition = this.guideLineCount * this.lineSpacing + (clefConfig.anchorLineIndex * this.lineSpacing);
        var stepOffset = this.getDiatonicStepFromMidiNote(midiNote) - this.getDiatonicStepFromMidiNote(clefConfig.anchorMidiNote);

        return anchorPosition - (stepOffset * pixelsPerDiatonicStep);
    }

    updateStaffOffset() {
        var topMostPosition = this.getRawPositionForNote(this.maxMidiNote);
        this.staffOffset = Math.max(0, this.verticalPadding - topMostPosition);
    }

    getPositionForNote(midiNote) {
        return this.staffOffset + this.getRawPositionForNote(midiNote);
    }

    appendStaffLine(staffDiv, top, type) {
        var lineDiv = document.createElement("div");
        lineDiv.className = "staffLine " + type;
        lineDiv.style.top = top + "px";
        staffDiv.appendChild(lineDiv);
    }

    appendNotes(noteContainer) {
        var left = this.leftPadding;

        for (var midiNote = this.minMidiNote; midiNote <= this.maxMidiNote; midiNote++) {
            var noteName = this.arrayOfNotes[midiNote % 12];
            var noteDiv = document.createElement("div");
            noteDiv.className = "note";
            if (noteName.indexOf("#") > -1) {
                noteDiv.classList.add("accidental");
            }
            if (midiNote === this.middleCMidiNote) {
                noteDiv.classList.add("middleC");
            }
            noteDiv.id = "note" + midiNote;
            noteDiv.dataset.note = midiNote;
            noteDiv.innerHTML = noteName.replace("#", "&#9839;");
            noteDiv.style.top = (this.getPositionForNote(midiNote) - (this.noteSize / 2)) + "px";
            noteDiv.style.left = left + "px";
            left += this.noteSpacing;

            if (this.currentMidiNotes.includes(midiNote)) {
                noteDiv.classList.add("active");
            }
            if (this.hoverMidiNotes.includes(midiNote)) {
                noteDiv.classList.add("hover");
            }

            noteDiv.addEventListener("click", this.onNoteClick);
            noteDiv.addEventListener("mouseover", this.onNoteMouseOver);
            noteDiv.addEventListener("mouseout", this.onNoteMouseOut);
            noteContainer.appendChild(noteDiv);
        }
    }

    drawStaff() {
        var container = this.shadowRoot.getElementById("staffContainer");
        container.innerHTML = "";
        this.updateStaffOffset();

        var staffDiv = document.createElement("div");
        staffDiv.className = "staff";
        staffDiv.style.height = this.getStaffHeight() + "px";
        staffDiv.style.minWidth = this.getStaffWidth() + "px";

        for (var guideTop = 1; guideTop <= this.guideLineCount; guideTop++) {
            this.appendStaffLine(staffDiv, this.getStaffTop() - (guideTop * this.lineSpacing), "guide");
        }

        for (var line = 0; line < 5; line++) {
            this.appendStaffLine(staffDiv, this.getStaffTop() + (line * this.lineSpacing), "main");
        }

        for (var guideBottom = 1; guideBottom <= this.guideLineCount; guideBottom++) {
            this.appendStaffLine(staffDiv, this.getStaffBottom() + (guideBottom * this.lineSpacing), "guide");
        }

        var clefDiv = document.createElement("div");
        var clefConfig = this.getClefConfig();
        clefDiv.className = "clef";
        clefDiv.innerHTML = clefConfig.symbol;
        clefDiv.style.top = (this.getStaffTop() + (clefConfig.topOffset * this.lineSpacing)) + "px";
        staffDiv.appendChild(clefDiv);

        var labelDiv = document.createElement("div");
        labelDiv.className = "octaveLabel";
        labelDiv.innerHTML = this.clef + " Oct " + this.startOctave + " - " + this.endOctave;
        labelDiv.style.top = (this.getStaffBottom() + this.lineSpacing + 2) + "px";
        staffDiv.appendChild(labelDiv);

        var noteContainer = document.createElement("div");
        noteContainer.className = "noteContainer";
        this.appendNotes(noteContainer);
        staffDiv.appendChild(noteContainer);

        container.appendChild(staffDiv);
    }

    onNoteClick(event) {
        this.addNote(Number(event.currentTarget.dataset.note));
    }

    dispatchNoteHoverEvent(eventName, midiNote) {
        this.dispatchEvent(new CustomEvent(eventName, {
            detail: {
                midiNote: midiNote,
                note: this.getAmericanNoteFromMidiNote(midiNote)
            },
            bubbles: true,
            composed: true
        }));
    }

    onNoteMouseOver(event) {
        if (event.currentTarget.contains(event.relatedTarget)) {
            return;
        }

        this.dispatchNoteHoverEvent("staff-note-hover", Number(event.currentTarget.dataset.note));
    }

    onNoteMouseOut(event) {
        if (event.currentTarget.contains(event.relatedTarget)) {
            return;
        }

        this.dispatchNoteHoverEvent("staff-note-unhover", Number(event.currentTarget.dataset.note));
    }

    addNote(midiNote) {
        if (this.currentMidiNotes.includes(midiNote)) {
            return;
        }

        this.currentMidiNotes.push(midiNote);
        this.updateStatus();

        var noteEl = this.shadowRoot.getElementById("note" + midiNote);
        if (noteEl) {
            noteEl.classList.add("active");
        }
    }

    removeNote(midiNote) {
        var index = this.currentMidiNotes.indexOf(midiNote);
        if (index > -1) {
            this.currentMidiNotes.splice(index, 1);
        }

        this.updateStatus();

        var noteEl = this.shadowRoot.getElementById("note" + midiNote);
        if (noteEl) {
            noteEl.classList.remove("active");
        }
    }

    addHoverNote(midiNote) {
        if (this.hoverMidiNotes.includes(midiNote)) {
            return;
        }

        this.hoverMidiNotes.push(midiNote);

        var noteEl = this.shadowRoot.getElementById("note" + midiNote);
        if (noteEl) {
            noteEl.classList.add("hover");
        }
    }

    removeHoverNote(midiNote) {
        var index = this.hoverMidiNotes.indexOf(midiNote);
        if (index > -1) {
            this.hoverMidiNotes.splice(index, 1);
        }

        var noteEl = this.shadowRoot.getElementById("note" + midiNote);
        if (noteEl) {
            noteEl.classList.remove("hover");
        }
    }

    updateStatus() {
        var notes = this.currentMidiNotes.map((note) => this.getAmericanNoteFromMidiNote(note)).join(", ");
        this.shadowRoot.getElementById("currentMidiNotes").innerHTML = notes || "No notes";
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

            console.log("Staff -> note: " + note + " (" + this.getAmericanNoteFromMidiNote(note) + ")");
            console.log("velocity: " + velocity);
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
                    console.error("No access to MIDI devices.");
                }
            );
        } else {
            console.log("Browser does not support MIDI!");
        }
    }

    normalizeClef(clef) {
        if (clef === undefined) {
            return "SOL";
        }

        if (typeof clef !== "string") {
            console.error("Staff.init(startOctave, endOctave, lineSpacing, clef) requires clef to be \"SOL\", \"FA\", or \"DO\". Using SOL.");
            return "SOL";
        }

        var normalizedClef = clef.toUpperCase();

        if (normalizedClef !== "SOL" && normalizedClef !== "FA" && normalizedClef !== "DO") {
            console.error("Staff.init(startOctave, endOctave, lineSpacing, clef) requires clef to be \"SOL\", \"FA\", or \"DO\". Using SOL.");
            return "SOL";
        }

        return normalizedClef;
    }

    applyLineSpacing(lineSpacing) {
        if (lineSpacing === undefined) {
            lineSpacing = 10;
        }

        if (typeof lineSpacing !== "number" || lineSpacing <= 0) {
            console.error("Staff lineSpacing debe ser un numero positivo. Usando 10px.");
            this.lineSpacing = 10;
        } else {
            this.lineSpacing = lineSpacing;
        }
    }

    isValidMidiRange(startMidiNote, endMidiNote) {
        return Number.isInteger(startMidiNote) &&
            Number.isInteger(endMidiNote) &&
            startMidiNote >= 0 &&
            endMidiNote <= 127 &&
            startMidiNote < endMidiNote;
    }

    initOctave(startOctave, endOctave, lineSpacing, clef) {
        if (startOctave === undefined) {
            startOctave = 0;
        }
        if (endOctave === undefined) {
            endOctave = 8;
        }
        if (typeof lineSpacing === "string" && clef === undefined) {
            clef = lineSpacing;
            lineSpacing = 10;
        }

        if (
            !Number.isInteger(startOctave) ||
            !Number.isInteger(endOctave) ||
            startOctave >= endOctave ||
            startOctave < -1 ||
            endOctave > 9
        ) {
            console.error("Staff.initOctave(startOctave, endOctave, lineSpacing, clef) requires integer octaves between -1 and 9, and startOctave must be less than endOctave. Painting full staff.");
            this.startOctave = -1;
            this.endOctave = 9;
        } else {
            this.startOctave = startOctave;
            this.endOctave = endOctave;
        }

        this.applyLineSpacing(lineSpacing);
        this.clef = this.normalizeClef(clef);
        this.initMidi(Math.max(0, (this.startOctave + 1) * 12), Math.min(127, (this.endOctave + 1) * 12 + 11), this.lineSpacing, this.clef);
    }

    initMidi(startMidiNote, endMidiNote, lineSpacing, clef) {
        if (typeof lineSpacing === "string" && clef === undefined) {
            clef = lineSpacing;
            lineSpacing = 10;
        }

        if (!this.isValidMidiRange(startMidiNote, endMidiNote)) {
            console.error("Staff.initMidi(startMidiNote, endMidiNote, lineSpacing, clef) requires MIDI notes between 0 and 127, and startMidiNote must be less than endMidiNote. Painting full staff.");
            startMidiNote = 0;
            endMidiNote = 127;
        }

        this.applyLineSpacing(lineSpacing);
        this.clef = this.normalizeClef(clef);
        this.startOctave = Math.floor(startMidiNote / 12) - 1;
        this.endOctave = Math.floor(endMidiNote / 12) - 1;
        this.minMidiNote = startMidiNote;
        this.maxMidiNote = endMidiNote;

        this.drawStaff();
    }

    initRange(startNoteName, endNoteName, lineSpacing, clef) {
        if (typeof lineSpacing === "string" && clef === undefined) {
            clef = lineSpacing;
            lineSpacing = 10;
        }

        var startMidiNote = this.getMidiFromNoteName(startNoteName, true);
        var endMidiNote = this.getMidiFromNoteName(endNoteName, true);

        if (startMidiNote === null || endMidiNote === null) {
            console.error("Staff.initRange(startNoteName, endNoteName, lineSpacing, clef) requires valid notes, for example \"A0\" and \"C8\". Painting full staff.");
            this.initMidi(0, 127, lineSpacing, clef);
            return;
        }

        this.initMidi(startMidiNote, endMidiNote, lineSpacing, clef);
    }

    init(startOctave, endOctave, lineSpacing, clef) {
        this.initOctave(startOctave, endOctave, lineSpacing, clef);
    }

    clear() {
        this.currentMidiNotes = [];
        this.hoverMidiNotes = [];
        this.updateStatus();
        this.shadowRoot.getElementById("staffContainer").innerHTML = "";
    }
}

customElements.define("music-staff", StaffComponent);

window.Staff = {
    staffs: {},

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

    getClefType: function (lineSpacing, clef) {
        var clefType = clef;

        if (typeof lineSpacing === "string" && clefType === undefined) {
            clefType = lineSpacing;
        }

        if (clefType === undefined) {
            clefType = "SOL";
        }

        clefType = String(clefType).toUpperCase();

        return clefType;
    },

    getOrCreateStaff: function (elementId) {
        var container = document.getElementById("staffs-container");

        if (!container) {
            console.error("No #staffs-container found in DOM.");
            return null;
        }

        var staff = document.getElementById(elementId);
        if (!staff) {
            staff = document.createElement("music-staff");
            staff.id = elementId;
            container.appendChild(staff);
        }

        this.staffs[elementId] = staff;
        return staff;
    },

    initOctave: function (startOctave, endOctave, lineSpacing, clef) {
        var clefType = this.getClefType(lineSpacing, clef);
        var staff = this.getOrCreateStaff("music-staff-octave-" + clefType + "-" + startOctave + "-" + endOctave);
        if (!staff) {
            return;
        }

        staff.initOctave(startOctave, endOctave, lineSpacing, clefType);
    },

    initMidi: function (startMidiNote, endMidiNote, lineSpacing, clef) {
        var clefType = this.getClefType(lineSpacing, clef);
        var staff = this.getOrCreateStaff("music-staff-midi-" + clefType + "-" + startMidiNote + "-" + endMidiNote);
        if (!staff) {
            return;
        }

        staff.initMidi(startMidiNote, endMidiNote, lineSpacing, clefType);
    },

    initRange: function (startNoteName, endNoteName, lineSpacing, clef) {
        var clefType = this.getClefType(lineSpacing, clef);
        var normalizedStart = String(startNoteName).replace("#", "sharp").replace("♯", "sharp").replace("♭", "b").replace(/[^A-Za-z0-9]/g, "");
        var normalizedEnd = String(endNoteName).replace("#", "sharp").replace("♯", "sharp").replace("♭", "b").replace(/[^A-Za-z0-9]/g, "");
        var staff = this.getOrCreateStaff("music-staff-range-" + clefType + "-" + normalizedStart + "-" + normalizedEnd);
        if (!staff) {
            return;
        }

        staff.initRange(startNoteName, endNoteName, lineSpacing, clefType);
    },

    init: function (startOctave, endOctave, lineSpacing, clef) {
        this.initOctave(startOctave, endOctave, lineSpacing, clef);
    },

    clear: function () {
        var container = document.getElementById("staffs-container");
        if (!container) {
            console.error("No #staffs-container found in DOM.");
            return;
        }

        container.innerHTML = "";
        this.staffs = {};
    },

    highlight: function (notes) {
        var self = this;
        var normalizedNotes = this.normalizeNotes(notes);
        Object.keys(this.staffs).forEach(function (clef) {
            var staff = self.staffs[clef];
            if (staff) {
                staff.highlightNotes(normalizedNotes);
            }
        });
    },

    unhighlight: function (notes) {
        var self = this;
        var normalizedNotes = this.normalizeNotes(notes);
        Object.keys(this.staffs).forEach(function (clef) {
            var staff = self.staffs[clef];
            if (staff) {
                staff.unhighlightNotes(normalizedNotes);
            }
        });
    }
};
