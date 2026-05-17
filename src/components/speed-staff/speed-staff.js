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

    render() {
        var backLineUrl = new URL("../../images/back-line.png", import.meta.url).href;

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
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-image: url('./assets/clave.png');
                    background-size: contain;
                    background-repeat: no-repeat;
                    background-position: center;
                }
            </style>

            <div class="speed-staff">
                <div id="clave" class="clave"></div>
                <table aria-hidden="true">
                    <tbody>
                        ${this.getRowsHtml()}
                    </tbody>
                </table>
                <div id="clave" class="clave"></div>
            </div>
        `;
    }
}

if (!customElements.get("speed-staff")) {
    customElements.define("speed-staff", SpeedStaffComponent);
}

window.SpeedStaff = {
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
        return element;
    }
};
