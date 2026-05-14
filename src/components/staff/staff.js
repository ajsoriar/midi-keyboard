class MusicStaff extends HTMLElement {
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

        this.onMIDIMessage = this.onMIDIMessage.bind(this);
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
                }

                .staff {
                    position: relative;
                    width: 100%;
                    height: 100px;
                    margin-bottom: 20px;
                }

                .staffLine {
                    position: absolute;
                    width: 100%;
                    height: 1px;
                    background-color: #000;
                    left: 0;
                }

                .clef {
                    position: absolute;
                    left: 10px;
                    top: 5px;
                    font-size: 80px;
                    line-height: 1;
                }

                .noteContainer {
                    position: relative;
                    width: 100%;
                    height: 100px;
                    top: -100px;
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
                }

                .note.active {
                    background-color: #00ff00;
                    color: #000;
                    box-shadow: 0 0 8px rgba(0, 255, 0, 0.6);
                }

                .octaveLabel {
                    position: absolute;
                    left: 50px;
                    font-size: 12px;
                    font-weight: bold;
                    top: -20px;
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

    getMidiNoteFromName(noteName, octave) {
        var noteIndex = this.arrayOfNotes.indexOf(noteName);
        if (noteIndex === -1) {
            return -1;
        }
        return (octave + 1) * 12 + noteIndex;
    }

    getPositionForNote(midiNote) {
        // Treble clef: middle C (60) is on the middle line (position 50%)
        // Each semitone is approximately 2.5 pixels in height
        var middleC = 60;
        var pixelsPerSemitone = 2.5;
        var middlePosition = 50; // percentage

        var semitoneOffset = midiNote - middleC;
        var pixelOffset = semitoneOffset * pixelsPerSemitone;

        // Convert pixels to percentage (staff is 100px tall)
        var percentOffset = (pixelOffset / 100) * 100;
        var position = middlePosition - percentOffset; // Invert because higher notes go up

        return Math.max(0, Math.min(100, position));
    }

    drawStaff() {
        var container = this.shadowRoot.getElementById("staffContainer");
        container.innerHTML = "";

        for (var octave = this.startOctave; octave <= this.endOctave; octave++) {
            var staffDiv = document.createElement("div");
            staffDiv.className = "staff";

            // Draw 5 staff lines
            for (var line = 0; line < 5; line++) {
                var lineDiv = document.createElement("div");
                lineDiv.className = "staffLine";
                lineDiv.style.top = (line * 25) + "px";
                staffDiv.appendChild(lineDiv);
            }

            // Add clef (treble clef symbol)
            if (octave === this.startOctave) {
                var clefDiv = document.createElement("div");
                clefDiv.className = "clef";
                clefDiv.innerHTML = "𝄞"; // Treble clef Unicode symbol
                staffDiv.appendChild(clefDiv);
            }

            // Add octave label
            var labelDiv = document.createElement("div");
            labelDiv.className = "octaveLabel";
            labelDiv.innerHTML = "Oct " + octave;
            staffDiv.appendChild(labelDiv);

            // Add notes for this octave
            var noteContainer = document.createElement("div");
            noteContainer.className = "noteContainer";

            for (var noteIndex = 0; noteIndex < 12; noteIndex++) {
                var midiNote = octave * 12 + noteIndex;

                if (midiNote < this.minMidiNote || midiNote > this.maxMidiNote) {
                    continue;
                }

                var noteName = this.arrayOfNotes[noteIndex];
                var noteDiv = document.createElement("div");
                noteDiv.className = "note";
                noteDiv.id = "note" + midiNote;
                noteDiv.innerHTML = noteName.replace("#", "♯");
                noteDiv.style.top = this.getPositionForNote(midiNote) + "%";
                noteDiv.style.left = (50 + (noteIndex * 25)) + "px";

                if (this.currentMidiNotes.includes(midiNote)) {
                    noteDiv.classList.add("active");
                }

                noteDiv.addEventListener("click", () => this.addNote(midiNote));
                noteContainer.appendChild(noteDiv);
            }

            staffDiv.appendChild(noteContainer);
            container.appendChild(staffDiv);
        }
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
        var notes = this.currentMidiNotes.map(n => this.getAmericanNoteFromMidiNote(n)).join(", ");
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
            var time = message.timeStamp;
            var channel = message.data[0] & 0xf;

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

    init(startOctave, endOctave) {
        if (startOctave === undefined) {
            startOctave = 0;
        }
        if (endOctave === undefined) {
            endOctave = 8;
        }

        if (typeof startOctave !== "number" || typeof endOctave !== "number") {
            console.error("Staff.init(startOctave, endOctave) requires integer octaves between -1 and 9, and startOctave must be less than endOctave. Painting full staff.");
            this.startOctave = -1;
            this.endOctave = 9;
        } else if (startOctave >= endOctave || startOctave < -1 || endOctave > 9) {
            console.error("Staff.init(startOctave, endOctave) requires integer octaves between -1 and 9, and startOctave must be less than endOctave. Painting full staff.");
            this.startOctave = -1;
            this.endOctave = 9;
        } else {
            this.startOctave = startOctave;
            this.endOctave = endOctave;
        }

        var minMidiNote = this.startOctave * 12;
        var maxMidiNote = (this.endOctave + 1) * 12 - 1;

        this.minMidiNote = Math.max(0, minMidiNote);
        this.maxMidiNote = Math.min(127, maxMidiNote);

        this.drawStaff();
    }

    clear() {
        this.currentMidiNotes = [];
        this.updateStatus();
        this.shadowRoot.getElementById("staffContainer").innerHTML = "";
    }
}

customElements.define("music-staff", MusicStaff);

window.Staff = {
    getElement: function () {
        return document.querySelector("music-staff");
    },

    init: function (startOctave, endOctave) {
        var staff = this.getElement();
        if (!staff) {
            console.error("No <music-staff> element found.");
            return;
        }

        staff.init(startOctave, endOctave);
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
