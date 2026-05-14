class StaffComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });

        this.arrayOfAmericanNotes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
        this.arrayOfNotes = ["Do", "Do#", "Re", "Re#", "Mi", "Fa", "Fa#", "Sol", "Sol#", "La", "La#", "Si"];

        this.currentMidiNotes = [];
        this.startOctave = 0;
        this.endOctave = 8;
        this.minMidiNote = 0;
        this.maxMidiNote = 127;
        this.middleCMidiNote = 60;
        this.lineSpacing = 10;
        this.guideLineCount = 4;
        this.noteSpacing = 25;
        this.leftPadding = 50;

        this.onMIDIMessage = this.onMIDIMessage.bind(this);
        this.onNoteClick = this.onNoteClick.bind(this);
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
                    margin: 20px 0;
                    overflow-x: auto;
                }

                .staff {
                    position: relative;
                    width: 100%;
                    margin-bottom: 20px;
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
                    background-color: #000;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 8px;
                    color: #fff;
                    z-index: 2;
                }

                .note.active {
                    background-color: #00ff00;
                    color: #000;
                    box-shadow: 0 0 8px rgba(0, 255, 0, 0.6);
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

    getStaffTop() {
        return this.guideLineCount * this.lineSpacing;
    }

    getStaffBottom() {
        return this.getStaffTop() + (this.lineSpacing * 4);
    }

    getStaffHeight() {
        return ((this.guideLineCount * 2) + 4) * this.lineSpacing + 24;
    }

    getStaffWidth() {
        return this.leftPadding + ((this.maxMidiNote - this.minMidiNote + 1) * this.noteSpacing) + 24;
    }

    getPositionForNote(midiNote) {
        var pixelsPerSemitone = this.lineSpacing / 4;
        var middlePosition = this.getStaffTop() + (this.lineSpacing * 2);
        var semitoneOffset = midiNote - this.middleCMidiNote;
        var position = middlePosition - (semitoneOffset * pixelsPerSemitone);

        return Math.max(0, Math.min(this.getStaffHeight() - 20, position));
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
            noteDiv.id = "note" + midiNote;
            noteDiv.dataset.note = midiNote;
            noteDiv.innerHTML = noteName.replace("#", "&#9839;");
            noteDiv.style.top = this.getPositionForNote(midiNote) + "px";
            noteDiv.style.left = left + "px";
            left += this.noteSpacing;

            if (this.currentMidiNotes.includes(midiNote)) {
                noteDiv.classList.add("active");
            }

            noteDiv.addEventListener("click", this.onNoteClick);
            noteContainer.appendChild(noteDiv);
        }
    }

    drawStaff() {
        var container = this.shadowRoot.getElementById("staffContainer");
        container.innerHTML = "";

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
        clefDiv.className = "clef";
        clefDiv.innerHTML = "&#119070;";
        clefDiv.style.top = (this.getStaffTop() - this.lineSpacing) + "px";
        staffDiv.appendChild(clefDiv);

        var labelDiv = document.createElement("div");
        labelDiv.className = "octaveLabel";
        labelDiv.innerHTML = "Oct " + this.startOctave + " - " + this.endOctave;
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

    init(startOctave, endOctave, lineSpacing) {
        if (startOctave === undefined) {
            startOctave = 0;
        }
        if (endOctave === undefined) {
            endOctave = 8;
        }
        if (lineSpacing === undefined) {
            lineSpacing = 10;
        }

        if (
            !Number.isInteger(startOctave) ||
            !Number.isInteger(endOctave) ||
            startOctave >= endOctave ||
            startOctave < -1 ||
            endOctave > 9
        ) {
            console.error("Staff.init(startOctave, endOctave, lineSpacing) requires integer octaves between -1 and 9, and startOctave must be less than endOctave. Painting full staff.");
            this.startOctave = -1;
            this.endOctave = 9;
        } else {
            this.startOctave = startOctave;
            this.endOctave = endOctave;
        }

        if (typeof lineSpacing !== "number" || lineSpacing <= 0) {
            console.error("Staff.init(startOctave, endOctave, lineSpacing) requires lineSpacing to be a positive number. Using 10px.");
            this.lineSpacing = 10;
        } else {
            this.lineSpacing = lineSpacing;
        }

        this.minMidiNote = Math.max(0, (this.startOctave + 1) * 12);
        this.maxMidiNote = Math.min(127, (this.endOctave + 1) * 12 + 11);

        this.drawStaff();
    }

    clear() {
        this.currentMidiNotes = [];
        this.updateStatus();
        this.shadowRoot.getElementById("staffContainer").innerHTML = "";
    }
}

customElements.define("music-staff", StaffComponent);

window.Staff = {
    getElement: function () {
        return document.querySelector("music-staff");
    },

    init: function (startOctave, endOctave, lineSpacing) {
        var staff = this.getElement();
        if (!staff) {
            console.error("No <music-staff> element found.");
            return;
        }

        staff.init(startOctave, endOctave, lineSpacing);
    },

    clear: function () {
        var staff = this.getElement();
        if (!staff) {
            console.error("No <music-staff> element found.");
            return;
        }

        staff.clear();
    }
};
