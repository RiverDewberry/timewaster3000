const canvas = document.getElementById("gameCanvas");
canvas.width = 500;
canvas.height = 500;
const ctx = canvas.getContext("2d");

const menu = {

    currentMenu: null,
    menuShown: false,

    switchMenu: function (newMenu)
    {
        menu.removeMenu();
        menu.currentMenu = newMenu;
        menu.menuShown = true;
        menu.currentMenu.enter();
        window.addEventListener("keydown", menu.currentMenu.loop);
    },

    removeMenu: function ()
    {
        if (menu.menuShown)
        {
            window.removeEventListener("keydown", menu.currentMenu.loop);
            menu.menuShown = false;
        }
    },

    startGameMenu: {
        enter: function()
        {
            endKeyDownListen();
            menu.startGameMenu.loop({key: ""});
        },

        loop: function(e)
        {
            gameState.ctx.clearRect(0, 0, 500, 500);
        
            ctx.font = "25px Monospace";
            ctx.fillStyle = "Black";

            ctx.fillText("Press [Enter] to start game", 20, 50);

            if (e.key == "Enter")
            {
                menu.removeMenu();
                startKeyDownListen();
                gameState.begin();
            }
        }
    },

    pauseMenu: {
        enter: function()
        {
            gameState.pause();
            endKeyDownListen();
        
            ctx.fillStyle = "#00000040";
            ctx.fillRect(0, 0, 500, 500);

            ctx.font = "25px Monospace";
            ctx.fillStyle = "Black";
            ctx.strokeStyle = "White";
            ctx.miterLimit = 2;
            ctx.lineJoin = 'circle';

            let tempText = "Paused - Score: " +
                Math.round(gameState.gameData.enemySpawner.gameTime / 40);

            ctx.strokeText(tempText, 20, 50);
            ctx.fillText(tempText, 20, 50);
        },

        loop: function(e)
        {
            if (e.key == "p")
            {
                menu.removeMenu();
                startKeyDownListen();
                gameState.resume();
            }
        }
    },

    deathMenu: {
        enter: function()
        {
            ctx.fillStyle = "#00000040";
            ctx.fillRect(0, 0, 500, 500);

            ctx.font = "25px Monospace";
            ctx.fillStyle = "Black";
            ctx.strokeStyle = "White";
            ctx.miterLimit = 2;
            ctx.lineJoin = 'circle';

            ctx.strokeText("You died with a score of " +
                Math.round(gameState.gameData.enemySpawner.gameTime / 40), 20, 50);
            ctx.strokeText("Press [Enter] to continue", 20, 100);

            ctx.fillText("You died with a score of " +
                Math.round(gameState.gameData.enemySpawner.gameTime / 40), 20, 50);
            ctx.fillText("Press [Enter] to continue", 20, 100);

            endKeyDownListen();
        },

        loop: function(e)
        {
            if (e.key == "Enter")
            {
                startKeyDownListen();
                menu.switchMenu(menu.startGameMenu);
            }
        }
    }
}

const gameState = new GameState(ctx, 25,
    function() {menu.switchMenu(menu.deathMenu);},
    function() {menu.switchMenu(menu.pauseMenu);}
);

menu.switchMenu(menu.startGameMenu);