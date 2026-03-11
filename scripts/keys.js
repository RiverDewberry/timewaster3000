let keysDown = [];

function keysDownAdd(e) {
    if (!keysDown.includes(e.key))
        keysDown.push(e.key);
}

function keysDownRemove(e) {
    if (keysDown.includes(e.key)) {
        if (e.key === "Shift")
            keysDown = keysDown.slice(0, keysDown.indexOf("Shift"));
        keysDown.splice(keysDown.indexOf(e.key), 1);
    };
}

window.addEventListener('keydown', keysDownAdd);
window.addEventListener('keyup', keysDownRemove);
//tracks what keys are down