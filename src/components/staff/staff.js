class StaffComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });

        this.arrayOfAmericanNotes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
        this.arrayOfNotes = ["Do", "Do#", "Re", "Re#", "Mi", "Fa", "Fa#", "Sol", "Sol#", "La", "La#", "Si"];

        this.currentMidiNotes = [];
        this.hoverMidiNotes = [];
        this.customNoteColors = {};
        this.startOctave = 0;
        this.endOctave = 8;
        this.minMidiNote = 0;
        this.maxMidiNote = 127;
        this.clef = "SOL";
        this.lineSpacing = 10;
        this.guideLineCount = 4;
        this.noteSpacing = 25;
        this.leftPadding = 50;
        this.noteSize = 20;
        this.verticalPadding = 20;
        this.staffOffset = 0;
        this.paintIsOn = true;

        this.onMIDIMessage = this.onMIDIMessage.bind(this);
        this.onNoteClick = this.onNoteClick.bind(this);
        this.onNoteMouseOver = this.onNoteMouseOver.bind(this);
        this.onNoteMouseOut = this.onNoteMouseOut.bind(this);
        this.onLaunchEvent = this.onLaunchEvent.bind(this);
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
        document.addEventListener("launch-event", this.onLaunchEvent);
        this.setupMIDI();
    }

    disconnectedCallback() {
        document.removeEventListener("launch-event", this.onLaunchEvent);
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
                    background-color: #e1e1e1;
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

                .note.customHighlight {
                    background-color: var(--custom-note-color);
                    border-color: var(--custom-note-color);
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
            if (this.customNoteColors[midiNote]) {
                noteDiv.style.setProperty("--custom-note-color", this.customNoteColors[midiNote]);
                noteDiv.classList.add("customHighlight");
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
        if (!this.paintIsOn) {
            return;
        }

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

    clearPaint() {
        this.currentMidiNotes = [];
        this.hoverMidiNotes = [];
        this.updateStatus();

        var activeNotes = this.shadowRoot.querySelectorAll(".active");
        for (var i = 0; i < activeNotes.length; i++) {
            activeNotes[i].classList.remove("active");
        }

        var hoverNotes = this.shadowRoot.querySelectorAll(".hover");
        for (var j = 0; j < hoverNotes.length; j++) {
            hoverNotes[j].classList.remove("hover");
        }
    }

    clearCustomHighlights() {
        this.customNoteColors = {};

        var customHighlights = this.shadowRoot.querySelectorAll(".customHighlight");
        for (var i = 0; i < customHighlights.length; i++) {
            customHighlights[i].classList.remove("customHighlight");
            customHighlights[i].style.removeProperty("--custom-note-color");
        }
    }

    clearAll() {
        this.clearPaint();
        this.clearCustomHighlights();
    }

    clear() {
        this.clearPaint();
    }

    destroy() {
        this.currentMidiNotes = [];
        this.hoverMidiNotes = [];
        this.customNoteColors = {};

        if (this.parentNode) {
            this.parentNode.removeChild(this);
        }
    }

    setCustomNoteColor(midiNote, color) {
        if (!Number.isInteger(midiNote) || typeof color !== "string" || color.trim() === "") {
            return;
        }

        this.customNoteColors[midiNote] = color.trim();
        this.applyCustomNoteColor(midiNote);
    }

    applyCustomNoteColor(midiNote) {
        var note = this.shadowRoot.getElementById("note" + midiNote);
        if (!note) {
            return;
        }

        note.style.setProperty("--custom-note-color", this.customNoteColors[midiNote]);
        note.classList.add("customHighlight");
    }

    onLaunchEvent(event) {
        var detail = event.detail || {};
        if (!Array.isArray(detail.notes)) {
            return;
        }

        for (var i = 0; i < detail.notes.length; i++) {
            var noteConfig = detail.notes[i] || {};
            var noteName = noteConfig.nota || noteConfig.note;
            var midiNote = this.getMidiFromNoteName(noteName, true);
            if (midiNote === null) {
                console.error("LaunchEvent staff note invalid -> " + noteName);
                continue;
            }

            if (midiNote < this.minMidiNote || midiNote > this.maxMidiNote) {
                continue;
            }

            this.setCustomNoteColor(midiNote, noteConfig.color);
        }
    }
}

customElements.define("music-staff", StaffComponent);

window.Staff = {
    staffs: {},
    paintIsOn: true,

    bindControls: function (container) {
        var controls = container.querySelector("#staffs-component-controls");
        if (controls) {
            return;
        }

        if (!document.getElementById("staffs-component-controls-style")) {
            var style = document.createElement("style");
            style.id = "staffs-component-controls-style";
            style.textContent = "\n" +
                "#staffs-container {\n" +
                "    position: relative;\n" +
                "}\n" +
                "#staffs-component-controls {\n" +
                "    position: absolute;\n" +
                "    top: 0;\n" +
                "    right: 0;\n" +
                "    display: flex;\n" +
                "    gap: 2px;\n" +
                "    padding: 4px;\n" +
                "    z-index: 1000;\n" +
                "}\n" +
                "#staffs-component-controls .button {\n" +
                "    padding: 2px 4px;\n" +
                "    border: 2px solid #333;\n" +
                "    background-color: #f0f0f0;\n" +
                "    color: #000;\n" +
                "    border-radius: 1px;\n" +
                "    cursor: pointer;\n" +
                "    font-size: 10px;\n" +
                "    font-family: sans-serif;\n" +
                "    font-weight: 700;\n" +
                "}\n" +
                "#staffs-component-controls input {\n" +
                "    margin: 0 3px 0 0;\n" +
                "    vertical-align: middle;\n" +
                "}\n" +
                "#staffs-component-controls label {\n" +
                "    cursor: pointer;\n" +
                "}\n" +
                "#staffs-component-controls .button:hover {\n" +
                "    background-color: #e0e0e0;\n" +
                "}\n";
            document.head.appendChild(style);
        }

        controls = document.createElement("div");
        controls.id = "staffs-component-controls";

        var paintButton = document.createElement("div");
        paintButton.className = "button";

        var paintToggle = document.createElement("input");
        paintToggle.id = "staffs-paint";
        paintToggle.type = "checkbox";
        paintToggle.checked = this.paintIsOn;
        paintToggle.addEventListener("change", () => {
            this.setPaintIsOn(paintToggle.checked);
        });

        var paintLabel = document.createElement("label");
        paintLabel.htmlFor = "staffs-paint";
        paintLabel.textContent = "Paint";

        paintButton.appendChild(paintToggle);
        paintButton.appendChild(paintLabel);

        var clearButton = document.createElement("div");
        clearButton.id = "staffs-clear-paint";
        clearButton.className = "button";
        clearButton.textContent = "Clear Paint";
        clearButton.addEventListener("click", () => {
            this.clearPaint();
        });

        var clearAllButton = document.createElement("div");
        clearAllButton.id = "staffs-clear-all";
        clearAllButton.className = "button";
        clearAllButton.textContent = "Clear All";
        clearAllButton.addEventListener("click", () => {
            this.clearAll();
        });

        var closeButton = document.createElement("div");
        closeButton.id = "staffs-close";
        closeButton.className = "button";
        closeButton.textContent = "X";
        closeButton.addEventListener("click", () => {
            this.destroy();
        });

        controls.appendChild(paintButton);
        controls.appendChild(clearButton);
        controls.appendChild(clearAllButton);
        controls.appendChild(closeButton);
        container.appendChild(controls);
    },

    setPaintIsOn: function (paintIsOn) {
        var self = this;
        this.paintIsOn = paintIsOn;
        Object.keys(this.staffs).forEach(function (staffId) {
            var staff = self.staffs[staffId];
            if (staff) {
                staff.paintIsOn = paintIsOn;
            }
        });
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

        this.bindControls(container);

        var staff = document.getElementById(elementId);
        if (!staff) {
            staff = document.createElement("music-staff");
            staff.id = elementId;
            staff.paintIsOn = this.paintIsOn;
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

    clearPaint: function () {
        var container = document.getElementById("staffs-container");
        if (!container) {
            console.error("No #staffs-container found in DOM.");
            return;
        }

        var self = this;
        Object.keys(this.staffs).forEach(function (staffId) {
            var staff = self.staffs[staffId];
            if (staff && document.body.contains(staff)) {
                staff.clearPaint();
            } else {
                delete self.staffs[staffId];
            }
        });
    },

    clearAll: function () {
        var container = document.getElementById("staffs-container");
        if (!container) {
            console.error("No #staffs-container found in DOM.");
            return;
        }

        var self = this;
        Object.keys(this.staffs).forEach(function (staffId) {
            var staff = self.staffs[staffId];
            if (staff && document.body.contains(staff)) {
                staff.clearAll();
            } else {
                delete self.staffs[staffId];
            }
        });
    },

    clear: function () {
        this.clearPaint();
    },

    destroy: function () {
        var container = document.getElementById("staffs-container");
        if (!container) {
            console.error("No #staffs-container found in DOM.");
            return;
        }

        this.staffs = {};
        container.parentNode.removeChild(container);
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
