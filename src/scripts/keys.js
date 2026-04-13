let keysDown = [];

function keysDownAdd(e) {
    let key = (e.key === " ") ? "Space" : e.key;

    if (!keysDown.includes(key))
        keysDown.push(key);
}

function keysDownRemove(e) {
    let key = (e.key === " ") ? "Space" : e.key;

    if (keysDown.includes(key)) {
        if (key === "Shift")
            keysDown = keysDown.slice(0, keysDown.indexOf("Shift"));
        keysDown.splice(keysDown.indexOf(key), 1);
    };
}

function startKeyDownListen()
{
    window.addEventListener('keydown', keysDownAdd);
    window.addEventListener('keyup', keysDownRemove);
}

function endKeyDownListen()
{
    window.removeEventListener('keydown', keysDownAdd);
    window.removeEventListener('keyup', keysDownRemove);
    
    keysDown = [];
}