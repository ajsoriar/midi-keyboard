class SpeedStaffComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });

        this.width = "50%";
        this.height = "25px";
        this.x = "0px";
        this.y = "0px";
        this.rowHeight = 25;
        this.rowCount = 5;
        this.guideLinesAbove = 0;
        this.guideLinesBelow = 0;
        this.maxGuideLines = 32;
        this.lines = [];
        this.notesVisible = false;
        this.edgeLineVisible = false;

        this.onNoteHover = this.onNoteHover.bind(this);
        this.onNoteUnhover = this.onNoteUnhover.bind(this);
        this.onLineMouseOver = this.onLineMouseOver.bind(this);
        this.onLineMouseOut = this.onLineMouseOut.bind(this);
        this.onLaunchEvent = this.onLaunchEvent.bind(this);
    }

    connectedCallback() {
        this.bindNoteEvents();
        document.addEventListener("launch-event", this.onLaunchEvent);
        this.render();
    }

    disconnectedCallback() {
        this.unbindNoteEvents();
        document.removeEventListener("launch-event", this.onLaunchEvent);
    }

    init(options) {
        if (!options || typeof options !== "object") {
            console.error("SpeedStaff.init expects an options object.");
            return;
        }

        var size = options.size || {};
        var position = options.position || {};
        var rows = options.rows || {};

        this.name = this.normalizeName(options.name);
        this.width = this.normalizePercentage(size.wPercentage, "50%");
        this.x = this.normalizePercentage(position.xPercentage, "0%");
        this.y = this.normalizeCssSize(position.yPx, "0px", false);
        this.rowHeight = this.normalizePositiveInteger(rows.heightPx, 25);
        this.applyRowConfig(rows);
        this.height = this.normalizeHeight(size.h, this.rowCount * this.rowHeight);
        this.dataset.name = this.name;
        this.clave = options.clave || null;

        this.render();
    }

    normalizeName(value) {
        if (value === undefined || value === null || value === "") {
            return "SpeedStaff";
        }

        return String(value).trim();
    }

    normalizePercentage(value, fallback) {
        if (value === undefined || value === null || value === "") {
            return fallback;
        }

        if (typeof value === "number") {
            return value + "%";
        }

        if (typeof value !== "string") {
            console.error("SpeedStaff percentage must be a number or string.");
            return fallback;
        }

        var cleanValue = value.trim();
        if (!cleanValue) {
            return fallback;
        }

        return cleanValue.endsWith("%") ? cleanValue : cleanValue + "%";
    }

    normalizePositiveInteger(value, fallback) {
        var numericValue = Number(value);
        if (!Number.isFinite(numericValue) || numericValue <= 0) {
            return fallback;
        }

        return Math.round(numericValue);
    }

    normalizeRowCount(value, fallback) {
        return Math.max(5, this.normalizePositiveInteger(value, fallback));
    }

    normalizeGuideLineCount(value, fallback) {
        var numericValue = Number(value);
        if (!Number.isFinite(numericValue) || numericValue < 0) {
            return fallback;
        }

        return Math.min(this.maxGuideLines, Math.round(numericValue));
    }

    hasGuideLineConfig(rows) {
        return rows.guideLinesAbove !== undefined ||
            rows.guideLinesBelow !== undefined ||
            rows.guideLinesBefore !== undefined ||
            rows.guideLinesAfter !== undefined;
    }

    applyRowConfig(rows) {
        if (this.hasGuideLineConfig(rows)) {
            this.guideLinesAbove = this.normalizeGuideLineCount(
                rows.guideLinesAbove !== undefined ? rows.guideLinesAbove : rows.guideLinesBefore,
                0
            );
            this.guideLinesBelow = this.normalizeGuideLineCount(
                rows.guideLinesBelow !== undefined ? rows.guideLinesBelow : rows.guideLinesAfter,
                0
            );
            this.rowCount = (this.guideLinesAbove + 5 + this.guideLinesBelow) * 2 - 1;
            return;
        }

        var lineCount = this.normalizeRowCount(rows.num, 5);
        this.guideLinesAbove = Math.max(0, Math.floor((lineCount - 5) / 2));
        this.guideLinesBelow = Math.max(0, lineCount - 5 - this.guideLinesAbove);
        this.rowCount = lineCount * 2 - 1;
    }

    normalizeHeight(value, calculatedHeight) {
        if (value === undefined || value === null || value === "") {
            return calculatedHeight + "px";
        }

        return this.normalizeCssSize(value, calculatedHeight + "px", true);
    }

    normalizeCssSize(value, fallback, snapPixelsToFive) {
        if (value === undefined || value === null || value === "") {
            return fallback;
        }

        if (typeof value === "number") {
            return this.formatPixelValue(value, snapPixelsToFive);
        }

        if (typeof value !== "string") {
            console.error("SpeedStaff size must be a number or CSS size string.");
            return fallback;
        }

        var cleanValue = value.trim();
        if (!cleanValue) {
            return fallback;
        }

        if (cleanValue.endsWith("%")) {
            return cleanValue;
        }

        if (cleanValue.endsWith("px")) {
            var pixelValue = Number(cleanValue.slice(0, -2));
            if (!Number.isFinite(pixelValue)) {
                console.error("SpeedStaff pixel size must be a valid number.");
                return fallback;
            }

            return this.formatPixelValue(pixelValue, snapPixelsToFive);
        }

        var numericValue = Number(cleanValue);
        if (Number.isFinite(numericValue)) {
            return this.formatPixelValue(numericValue, snapPixelsToFive);
        }

        return cleanValue;
    }

    formatPixelValue(value, snapPixelsToFive) {
        var safeValue = Math.max(0, value);
        if (snapPixelsToFive) {
            safeValue = Math.max(this.rowHeight, Math.round(safeValue / this.rowHeight) * this.rowHeight);
        }

        return safeValue + "px";
    }

    getRowsHtml() {
        var rows = [];
        for (var index = 0; index < this.rowCount; index++) {
            var rowClass = this.getLineClass(index);
            var lineNote = this.getLineNote(index);
            var lineMidiNote = this.getMidiNoteFromLineIndex(index);
            var noteClass = this.notesVisible ? "nota" : "nota hidden";
            rows.push(`<tr class="${rowClass}" data-midi-note="${lineMidiNote}" data-note="${lineNote}"><td><div class="${noteClass}" data-note="${lineNote}">${lineNote}</div></td></tr>`);
        }

        return rows.join("");
    }

    getLineClass(index) {
        if (index % 2 !== 0) {
            return "space-row";
        }

        var firstBlackLineIndex = this.getFirstBlackLineIndex();
        var lastBlackLineIndex = firstBlackLineIndex + 8;

        if (index >= firstBlackLineIndex && index <= lastBlackLineIndex) {
            return "staff-line";
        }

        return "guide-line";
    }

    getClaveImageInfo(claveType) {
        var images = {
            SOL: { file: "clave-sol_44x130_center-22-85.png", w: 44, h: 130, centerX: 22, centerY: 85 },
            FA:  { file: "clave-fa_44x64_center-22-20.png",  w: 44, h: 64,  centerX: 22, centerY: 20 }
        };
        return images[claveType] || null;
    }

    getClefConfig(claveType) {
        var clefs = {
            SOL: {
                anchorMidiNote: 67,
                anchorLineIndex: 3
            },
            FA: {
                anchorMidiNote: 53,
                anchorLineIndex: 1
            },
            DO: {
                anchorMidiNote: 60,
                anchorLineIndex: 2
            }
        };

        return clefs[claveType] || clefs.SOL;
    }

    getFirstBlackLineIndex() {
        return this.guideLinesAbove * 2;
    }

    getStaffTopOffset() {
        return this.getFirstBlackLineIndex() * this.rowHeight;
    }

    getLineTop(index) {
        return (index * this.rowHeight) + (this.rowHeight / 2);
    }

    getDiatonicStepFromMidiNote(midiNote) {
        var pitchClass = midiNote % 12;
        var octave = Math.floor(midiNote / 12) - 1;
        var naturalStepByPitchClass = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];

        return (octave * 7) + naturalStepByPitchClass[pitchClass];
    }

    getNaturalNoteFromDiatonicStep(diatonicStep) {
        var notes = ["Do", "Re", "Mi", "Fa", "Sol", "La", "Si"];
        var naturalIndex = ((diatonicStep % notes.length) + notes.length) % notes.length;
        var octave = Math.floor(diatonicStep / notes.length);

        return notes[naturalIndex] + octave;
    }

    getMidiNoteFromDiatonicStep(diatonicStep) {
        var pitchClasses = [0, 2, 4, 5, 7, 9, 11];
        var naturalIndex = ((diatonicStep % pitchClasses.length) + pitchClasses.length) % pitchClasses.length;
        var octave = Math.floor(diatonicStep / pitchClasses.length);

        return (octave + 1) * 12 + pitchClasses[naturalIndex];
    }

    getLineNote(index) {
        return this.getNaturalNoteFromDiatonicStep(this.getDiatonicStepFromLineIndex(index));
    }

    getMidiNoteFromLineIndex(index) {
        return this.getMidiNoteFromDiatonicStep(this.getDiatonicStepFromLineIndex(index));
    }

    getDiatonicStepFromLineIndex(index) {
        var clefConfig = this.getClefConfig(this.clave);
        var firstBlackLineIndex = this.getFirstBlackLineIndex();
        var anchorRowIndex = firstBlackLineIndex + (clefConfig.anchorLineIndex * 2);
        var anchorStep = this.getDiatonicStepFromMidiNote(clefConfig.anchorMidiNote);
        var rowOffset = index - anchorRowIndex;

        return anchorStep - rowOffset;
    }

    getLineNoteFromMidiNote(midiNote) {
        if (!Number.isInteger(midiNote) || midiNote < 0 || midiNote > 127) {
            return null;
        }

        return this.getNaturalNoteFromDiatonicStep(this.getDiatonicStepFromMidiNote(midiNote));
    }

    getLineInfo(index) {
        var lineClass = this.getLineClass(index);

        return {
            note: this.getLineNote(index),
            color: lineClass === "staff-line" ? "black" : "gray",
            lineNumber: index + 1,
            top: this.getLineTop(index)
        };
    }

    updateLines() {
        var lines = [];
        for (var index = 0; index < this.rowCount; index++) {
            lines.push(this.getLineInfo(index));
        }

        this.lines = lines;
        if (window.SpeedStaff && typeof window.SpeedStaff.updatePentagrams === "function") {
            window.SpeedStaff.updatePentagrams();
        }
    }

    getPentagramInfo() {
        return {
            name: this.name,
            clef: this.clave,
            width: this.width,
            height: this.height,
            left: this.x,
            top: this.y,
            rowHeight: this.rowHeight,
            rowCount: this.rowCount,
            guideLinesAbove: this.guideLinesAbove,
            guideLinesBelow: this.guideLinesBelow,
            notesVisible: this.notesVisible,
            lines: this.lines.slice()
        };
    }

    setNotesVisible(isVisible) {
        this.notesVisible = Boolean(isVisible);

        var notes = this.shadowRoot.querySelectorAll(".nota");
        notes.forEach(function (note) {
            note.classList.toggle("hidden", !isVisible);
        });
    }

    showNotes() {
        this.setNotesVisible(true);
    }

    hideNotes() {
        this.setNotesVisible(false);
    }

    setEdgeLineVisible(isVisible) {
        this.edgeLineVisible = Boolean(isVisible);

        var edgeLine = this.shadowRoot.querySelector(".edge-line");
        if (edgeLine) {
            edgeLine.classList.toggle("hidden", !this.edgeLineVisible);
        }
    }

    showEdgeLine() {
        this.setEdgeLineVisible(true);
    }

    hideEdgeLine() {
        this.setEdgeLineVisible(false);
    }

    bindNoteEvents() {
        document.addEventListener("piano-note-hover", this.onNoteHover);
        document.addEventListener("piano-note-unhover", this.onNoteUnhover);
        document.addEventListener("staff-note-hover", this.onNoteHover);
        document.addEventListener("staff-note-unhover", this.onNoteUnhover);
    }

    unbindNoteEvents() {
        document.removeEventListener("piano-note-hover", this.onNoteHover);
        document.removeEventListener("piano-note-unhover", this.onNoteUnhover);
        document.removeEventListener("staff-note-hover", this.onNoteHover);
        document.removeEventListener("staff-note-unhover", this.onNoteUnhover);
    }

    onNoteHover(event) {
        this.highlightMidiNote(event.detail && event.detail.midiNote);
    }

    onNoteUnhover(event) {
        this.unhighlightMidiNote(event.detail && event.detail.midiNote);
    }

    highlightMidiNote(midiNote) {
        this.setNoteActive(this.getLineNoteFromMidiNote(midiNote), true);
    }

    unhighlightMidiNote(midiNote) {
        this.setNoteActive(this.getLineNoteFromMidiNote(midiNote), false);
    }

    setNoteActive(noteName, isActive) {
        if (!noteName) {
            return;
        }

        var notes = this.shadowRoot.querySelectorAll(".nota");
        notes.forEach(function (note) {
            if (note.dataset.note === noteName) {
                note.classList.toggle("active", isActive);
            }
        });
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

    getAmericanNoteFromMidiNote(midiNote) {
        var notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
        var note = notes[midiNote % 12];
        var octave = Math.floor(midiNote / 12) - 1;

        return note + octave;
    }

    getEventLine(event) {
        if (!event.target || typeof event.target.closest !== "function") {
            return null;
        }

        var line = event.target.closest("tr");
        if (!line || !this.shadowRoot.contains(line)) {
            return null;
        }

        return line;
    }

    onLineMouseOver(event) {
        var line = this.getEventLine(event);
        if (!line || line.contains(event.relatedTarget)) {
            return;
        }

        this.dispatchNoteHoverEvent("staff-note-hover", Number(line.dataset.midiNote));
    }

    onLineMouseOut(event) {
        var line = this.getEventLine(event);
        if (!line || line.contains(event.relatedTarget)) {
            return;
        }

        this.dispatchNoteHoverEvent("staff-note-unhover", Number(line.dataset.midiNote));
    }

    onLaunchEvent(event) {
        var detail = event.detail || {};
        if (!Array.isArray(detail.notes)) {
            return;
        }

        this.clearGuideLineHighlights();

        for (var i = 0; i < detail.notes.length; i++) {
            var noteConfig = detail.notes[i] || {};
            var noteName = noteConfig.nota || noteConfig.note;
            if (!noteName || !noteConfig.color) {
                continue;
            }

            var normalizedName = noteName.charAt(0).toUpperCase() + noteName.slice(1).toLowerCase();
            this.colorGuideLine(normalizedName, noteConfig.color);
        }
    }

    clearGuideLineHighlights() {
        var highlighted = this.shadowRoot.querySelectorAll("tr");
        for (var i = 0; i < highlighted.length; i++) {
            highlighted[i].style.backgroundColor = "";
        }
    }

    colorGuideLine(noteName, color) {
        var rows = this.shadowRoot.querySelectorAll("tr");
        for (var i = 0; i < rows.length; i++) {
            if (rows[i].getAttribute("data-note") === noteName) {
                rows[i].style.backgroundColor = color;
            }
        }
    }

    getClefTopOffset(claveInfo) {
        var clefConfig = this.getClefConfig(this.clave);
        var firstBlackLineIndex = this.getFirstBlackLineIndex();
        var anchorRowIndex = firstBlackLineIndex + (clefConfig.anchorLineIndex * 2);

        return Math.round(this.getLineTop(anchorRowIndex) - claveInfo.centerY);
    }

    render() {
        var backLineUrl = new URL("../../images/back-line.png", import.meta.url).href;
        this.updateLines();

        var claveStyle = "";
        if (this.clave) {
            var claveInfo = this.getClaveImageInfo(this.clave);
            if (claveInfo) {
                var claveUrl = new URL("../../images/" + claveInfo.file, import.meta.url).href;
                var topOffset = this.getClefTopOffset(claveInfo);
                claveStyle = "width:" + claveInfo.w + "px;height:" + claveInfo.h + "px;top:" + topOffset + "px;background-image:url('" + claveUrl + "');";
            }
        }

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    position: absolute;
                    display: block;
                    left: ${this.x};
                    top: ${this.y};
                    width: ${this.width};
                    height: ${this.height};
                    box-sizing: border-box;
                }

                .speed-staff {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    box-sizing: border-box;
                    overflow: hidden;
                    background: #ffffff;
                }

                table {
                    width: 100%;
                    height: 100%;
                    border-collapse: collapse;
                    table-layout: fixed;
                }

                tr {
                    height: ${this.rowHeight}px;
                }

                td {
                    position: relative;
                    padding: 0;
                    background-repeat: no-repeat;
                    background-position: left center;
                }

                .nota {
                    position: absolute;
                    left: 4px;
                    top: 50%;
                    transform: translateY(-50%);
                    font-size: 10px;
                    line-height: 1;
                    color: #666666;
                    pointer-events: none;
                    z-index: 1;
                }

                .nota.active {
                    color: #ffffff;
                    background: #0057ff;
                    padding: 2px 4px;
                    border-radius: 3px;
                    font-weight: bold;
                }

                .hidden {
                    display: none;
                }

                .edge-line {
                    position: absolute;
                    top: 0;
                    left: 10%;
                    width: 5px;
                    height: 100%;
                    background: red;
                    opacity: 0.7;
                    pointer-events: none;
                    z-index: 2;
                }

                .staff-line td {
                    background-image: url("${backLineUrl}");
                    background-repeat: repeat-x;
                }

                .guide-line td {
                    background-image: linear-gradient(#d0d0d0, #d0d0d0);
                    background-size: 100% 1px;
                }

                .space-row td {
                    background-image: none;
                }



            .clave {
                position: absolute;
                left: 0;
                background-repeat: no-repeat;
                z-index: 3;
            }
            </style>

            <div class="speed-staff">
                <table aria-hidden="true">
                    <tbody>
                        ${this.getRowsHtml()}
                    </tbody>
                </table>
                <div id="clave" class="clave" style="${claveStyle}"></div>
                <div class="edge-line${this.edgeLineVisible ? "" : " hidden"}"></div>
            </div>
        `;

        var table = this.shadowRoot.querySelector("table");
        if (table) {
            table.addEventListener("mouseover", this.onLineMouseOver);
            table.addEventListener("mouseout", this.onLineMouseOut);
        }
    }
}

if (!customElements.get("speed-staff")) {
    customElements.define("speed-staff", SpeedStaffComponent);
}

window.SpeedStaff = {
    instances: [],
    pentagrams: [],

    updateInstances: function () {
        this.instances = this.getElements();
    },

    updatePentagrams: function () {
        this.updateInstances();
        this.pentagrams = this.instances.map(function (element) {
            return element.getPentagramInfo();
        });
    },

    getPentagrams: function () {
        this.updatePentagrams();
        return this.pentagrams;
    },

    getElement: function (name) {
        var stage = this.getStage();
        if (!stage) {
            return null;
        }

        return stage.querySelector(`speed-staff[data-name="${CSS.escape(name)}"]`);
    },

    getElementByIndex: function (index) {
        this.updateInstances();

        var numericIndex = Number(index);
        if (!Number.isInteger(numericIndex) || numericIndex < 0 || numericIndex >= this.instances.length) {
            console.error("SpeedStaff index must be an integer between 0 and " + (this.instances.length - 1) + ".");
            return null;
        }

        return this.instances[numericIndex];
    },

    getInstance: function (index) {
        return this.getElementByIndex(index);
    },

    removeElement: function (element) {
        if (!element) {
            return false;
        }

        element.remove();
        this.updatePentagrams();
        return true;
    },

    destroy: function (index) {
        return this.removeElement(this.getElementByIndex(index));
    },

    destroyByName: function (name) {
        var elements = this.getElements(name);
        if (elements.length === 0) {
            console.error("No SpeedStaff instances found for name \"" + name + "\".");
            return 0;
        }

        elements.forEach(function (element) {
            element.remove();
        });
        this.updatePentagrams();

        return elements.length;
    },

    destroyAll: function () {
        var elements = this.getElements();
        elements.forEach(function (element) {
            element.remove();
        });
        this.updatePentagrams();

        return elements.length;
    },

    getElements: function (name) {
        var stage = this.getStage();
        if (!stage) {
            return [];
        }

        if (name === undefined || name === null || name === "") {
            return Array.from(stage.querySelectorAll("speed-staff"));
        }

        return Array.from(stage.querySelectorAll(`speed-staff[data-name="${CSS.escape(String(name).trim())}"]`));
    },

    getStage: function () {
        var stage = window.MusicBoard && typeof window.MusicBoard.getStage === "function"
            ? window.MusicBoard.getStage()
            : null;

        if (!stage) {
            console.error("No .stage element found for <speed-staff>.");
            return;
        }

        return stage;
    },

    init: function (options) {
        if (!options || typeof options !== "object") {
            console.error("SpeedStaff.init expects an options object.");
            return;
        }

        var stage = this.getStage();
        if (!stage) {
            return;
        }

        var name = options.name ? String(options.name).trim() : "SpeedStaff";
        var element = document.createElement("speed-staff");
        element.dataset.name = name;
        stage.appendChild(element);

        element.init(options);
        this.updatePentagrams();
        return element;
    },

    show: {
        notes: function (index) {
            var element = window.SpeedStaff.getElementByIndex(index);
            if (!element) {
                return;
            }

            element.showNotes();
            window.SpeedStaff.updatePentagrams();
        },

        edgeLine: function (index) {
            var element = window.SpeedStaff.getElementByIndex(index);
            if (!element) {
                return;
            }

            element.showEdgeLine();
            window.SpeedStaff.updatePentagrams();
        }
    },

    hide: {
        notes: function (index) {
            var element = window.SpeedStaff.getElementByIndex(index);
            if (!element) {
                return;
            }

            element.hideNotes();
            window.SpeedStaff.updatePentagrams();
        },

        edgeLine: function (index) {
            var element = window.SpeedStaff.getElementByIndex(index);
            if (!element) {
                return;
            }

            element.hideEdgeLine();
            window.SpeedStaff.updatePentagrams();
        }
    }
};
