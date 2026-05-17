class InstrumentLayout extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.instruments = [
            {
                id: "GUITAR_6",
                name: "Guitar",
                spriteX: 0,
                target: "staffs-container",
                notes: [
                    { nota: "MI2", color: "#ff4d4d" },
                    { nota: "LA2", color: "#ff9f1c" },
                    { nota: "RE3", color: "#ffd166" },
                    { nota: "SOL3", color: "#06d6a0" },
                    { nota: "SI3", color: "#118ab2" },
                    { nota: "MI4", color: "#9b5de5" }
                ]
            },
            {
                id: "PIANO",
                name: "Piano",
                spriteX: 1,
                target: "piano",
                notes: [
                    { nota: "DO4", color: "#ffd60a" }
                ]
            },
            {
                id: "CELLO",
                name: "Cello",
                spriteX: 2,
                target: "staffs-container",
                notes: [
                    { nota: "DO2", color: "#7bdff2" },
                    { nota: "SOL2", color: "#b2f7ef" },
                    { nota: "RE3", color: "#ffb703" },
                    { nota: "LA3", color: "#f7d6e0" }
                ]
            },
            {
                id: "DOUBLE_BASS",
                name: "Double Bass",
                spriteX: 3,
                target: "staffs-container",
                notes: [
                    { nota: "MI1", color: "#8ecae6" },
                    { nota: "LA1", color: "#219ebc" },
                    { nota: "RE2", color: "#ffb703" },
                    { nota: "SOL2", color: "#fb8500" }
                ]
            },
            {
                id: "VIOLA",
                name: "Viola",
                spriteX: 4,
                target: "staffs-container",
                notes: [
                    { nota: "DO3", color: "#cdb4db" },
                    { nota: "SOL3", color: "#ffc8dd" },
                    { nota: "RE4", color: "#ffafcc" },
                    { nota: "LA4", color: "#bde0fe" }
                ]
            },
            {
                id: "VIOLIN",
                name: "Violin",
                spriteX: 5,
                target: "staffs-container",
                notes: [
                    { nota: "SOL3", color: "#00bbf9" },
                    { nota: "RE4", color: "#00f5d4" },
                    { nota: "LA4", color: "#fee440" },
                    { nota: "MI5", color: "#f15bb5" }
                ]
            }
        ];
    }

    connectedCallback() {
        this.render();
    }

    render() {
        var spriteUrl = new URL("../../images/music_sprite.png", import.meta.url).href;

        var buttonsHtml = this.instruments.map(function (inst) {
            var posX = -(inst.spriteX * 70);
            return '<button type="button" class="inst-btn" data-id="' + inst.id + '" aria-label="' + inst.name + '" title="' + inst.name + '" style="background-image:url(\'' + spriteUrl + '\');background-position:' + posX + 'px 0;"></button>';
        }).join("");

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 4px;
                    padding: 5px;
                    width: 157px;
                    box-sizing: border-box;
                    font-family: sans-serif;
                    position: fixed;
                    top: 310px;
                    z-index: 200;
                    background-color: antiquewhite;
                    left: 10px;
                    border: 1px solid black;
                }
                .inst-btn {
                    width: 70px;
                    height: 70px;
                    border: 2px solid #333;
                    border-radius: 4px;
                    cursor: pointer;
                    background-size: 420px 70px;
                    background-repeat: no-repeat;
                    background-color: #f0f0f0;
                }
                .inst-btn:hover {
                    border-color: #888;
                    background-color: #e0e0e0;
                }
            </style>
            ${buttonsHtml}
        `;

        this.bindEvents();
    }

    bindEvents() {
        var buttons = this.shadowRoot.querySelectorAll(".inst-btn");
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].addEventListener("click", this);
        }
    }

    getInstrumentById(id) {
        for (var i = 0; i < this.instruments.length; i++) {
            if (this.instruments[i].id === id) {
                return this.instruments[i];
            }
        }

        throw new Error("Unknown instrument id: " + id);
    }

    clearAllComponents() {
        window.Piano.clearAll();
        window.Staff.clearAll();
    }

    handleEvent(event) {
        var id = event.currentTarget.getAttribute("data-id");
        var instrument = this.getInstrumentById(id);

        var launchEvent = {
            notes: instrument.notes
        };

        var eventDetail = {
            id: instrument.id,
            name: instrument.name,
            notes: instrument.notes,
            launchEvent: launchEvent
        };

        console.log(instrument.name);
        console.log(eventDetail);

        this.clearAllComponents();

        this.dispatchEvent(new CustomEvent("instrument-selected", {
            detail: eventDetail,
            bubbles: true,
            composed: true
        }));

        document.dispatchEvent(new CustomEvent("launch-event", {
            detail: launchEvent
        }));
    }
}

customElements.define("instrument-layout", InstrumentLayout);

window.instrumentLayout = {
    getElement: function () {
        return document.querySelector("instrument-layout");
    }
};
