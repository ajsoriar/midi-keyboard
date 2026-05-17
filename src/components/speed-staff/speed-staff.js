class SpeedStaffComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });

        this.width = "50%";
        this.height = "25px";
        this.x = "0px";
        this.y = "0px";
        this.rowHeight = 25;
        this.rowCount = 1;
        this.lines = [];
    }

    connectedCallback() {
        this.render();
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
        this.rowCount = this.normalizePositiveInteger(rows.num, 1);
        this.rowHeight = this.normalizePositiveInteger(rows.heightPx, 25);
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
            rows.push(`<tr class="${rowClass}"><td></td></tr>`);
        }

        return rows.join("");
    }

    getLineClass(index) {
        var firstBlackLineIndex = Math.max(0, Math.floor((this.rowCount - 5) / 2));
        var lastBlackLineIndex = Math.min(this.rowCount - 1, firstBlackLineIndex + 4);

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

    getStaffTopOffset() {
        var firstBlackLineIndex = Math.max(0, Math.floor((this.rowCount - 5) / 2));
        return firstBlackLineIndex * this.rowHeight;
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

    getLineNote(index) {
        var clefConfig = this.getClefConfig(this.clave);
        var firstBlackLineIndex = Math.max(0, Math.floor((this.rowCount - 5) / 2));
        var anchorRowIndex = firstBlackLineIndex + clefConfig.anchorLineIndex;
        var anchorStep = this.getDiatonicStepFromMidiNote(clefConfig.anchorMidiNote);
        var rowOffset = index - anchorRowIndex;

        return this.getNaturalNoteFromDiatonicStep(anchorStep - (rowOffset * 2));
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
            lines: this.lines.slice()
        };
    }

    getClefTopOffset(claveInfo) {
        var clefConfig = this.getClefConfig(this.clave);
        var firstBlackLineIndex = Math.max(0, Math.floor((this.rowCount - 5) / 2));
        var anchorRowIndex = firstBlackLineIndex + clefConfig.anchorLineIndex;

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
                    padding: 0;
                    background-repeat: no-repeat;
                    background-position: left center;
                }

                .staff-line td {
                    background-image: url("${backLineUrl}");
                    background-repeat: repeat-x;
                }

                .guide-line td {
                    background-image: linear-gradient(#d0d0d0, #d0d0d0);
                    background-size: 100% 1px;
                }

            .clave {
                position: absolute;
                left: 0;
                background-repeat: no-repeat;
            }
            </style>

            <div class="speed-staff">
                <table aria-hidden="true">
                    <tbody>
                        ${this.getRowsHtml()}
                    </tbody>
                </table>
                <div id="clave" class="clave" style="${claveStyle}"></div>
            </div>
        `;
    }
}

if (!customElements.get("speed-staff")) {
    customElements.define("speed-staff", SpeedStaffComponent);
}

window.SpeedStaff = {
    pentagrams: [],

    updatePentagrams: function () {
        this.pentagrams = this.getElements().map(function (element) {
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
    }
};
