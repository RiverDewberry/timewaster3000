const canvas = document.getElementById("gameCanvas");
canvas.width = 500;
canvas.height = 500;
const ctx = canvas.getContext("2d");

const menu = {

    firstRun: true,

    enterStartMenu: function()
    {
        endKeyDownListen();
        menu.startMenuLoop({key: ""});
        window.addEventListener("keydown", menu.startMenuLoop);
    },

    startMenuLoop: function(e)
    {
        gameState.ctx.clearRect(0, 0, 500, 500);
        
        ctx.font = "25px Monospace";
        ctx.fillStyle = "Black";
        if (menu.firstRun) {

            ctx.fillText("Press [Enter] to start game", 20, 50);
        } else {

            ctx.fillText("You died with a score of " +
                Math.round(gameState.gameData.enemySpawner.gameTime / 40), 20, 50);
            ctx.fillText("Press [Enter] to respawn", 20, 100);
        }

        if (e.key == "Enter")
        {
            if (menu.firstRun) menu.firstRun = false;
            window.removeEventListener("keydown", menu.startMenuLoop);
            startKeyDownListen();
            gameState.begin();
        }
    }
}

const gameState = new GameState(ctx, 25, menu.enterStartMenu);

menu.enterStartMenu();