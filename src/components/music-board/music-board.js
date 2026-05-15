class MusicBoardComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
    }

    connectedCallback() {
        this.render();
    }

    render() {
        var stageBackgroundUrl = new URL("../../images/bg-001.png", import.meta.url).href;

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                    margin: 0 0;
                }

                .stage {
                    width: min(100vw, 1920px);
                    aspect-ratio: 16 / 9;
                    background: #c9c9c9;
                    outline: 1px solid #005bff;
                    outline-offset: 0px;
                    box-sizing: border-box;
                    margin: 0 auto;
                    background-image: url("${stageBackgroundUrl}");
                }
            </style>

            <div class="stage"></div>
        `;
    }

    init() {
        this.render();
    }
}

if (!customElements.get("music-board")) {
    customElements.define("music-board", MusicBoardComponent);
}

if (!customElements.get("grand-staff-steps")) {
    class GrandStaffStepsComponent extends MusicBoardComponent {}
    customElements.define("grand-staff-steps", GrandStaffStepsComponent);
}

window.MusicBoard = {
    getElement: function () {
        return document.querySelector("music-board") || document.querySelector("grand-staff-steps");
    },

    init: function () {
        var element = this.getElement();
        if (!element) {
            console.error("No <music-board> element found.");
            return;
        }

        element.init();
    }
};

window.GrandStaffSteps = window.MusicBoard;
