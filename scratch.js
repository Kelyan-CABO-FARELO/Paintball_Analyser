const fs = require('fs');
let code = fs.readFileSync('/home/kcabofarelo/DEV/Paintball_Analyser/script.js', 'utf8');

// We evaluate the code in a mocked context to catch the exact runtime error
const vm = require('vm');
const context = {
    window: {
        addEventListener: () => {},
        updateUI: () => {},
        drawCanvas: () => {}
    },
    document: {
        querySelectorAll: () => [],
        getElementById: () => ({ classList: { remove: () => {}, add: () => {} }, getContext: () => ({}), addEventListener: () => {} })
    },
    canvas: { getContext: () => ({}), width: 1000, height: 600 },
    alert: console.log,
    console: console,
    Math: Math
};
vm.createContext(context);
vm.runInContext(code, context);

// Setup state
vm.runInContext(`
    fieldBounds = { x: 50, y: 50, w: 900, h: 500 };
    obstacles = [
        { x: 200, y: 250, type: 'temple', height: 'high', size: 25, rotation: 0 },
        { x: 400, y: 150, type: 'snake', height: 'low', size: 25, rotation: 0 }
    ];
    shooters = [
        { x: 60, y: 250, color: 'rgba(255,0,0,0.3)', playerNum: 1, team: 'left', active: true }
    ];
`, context);

try {
    vm.runInContext(`window.generateAIStrategy('offensive');`, context);
    console.log("Success! Arrows:", context.arrows ? context.arrows.length : 0);
} catch (e) {
    console.error("CAUGHT ERROR:", e);
}
