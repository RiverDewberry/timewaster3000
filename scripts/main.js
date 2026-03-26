const canvas = document.getElementById("gameCanvas");
canvas.width = 500;
canvas.height = 500;
const ctx = canvas.getContext("2d");

const menu = {

    currentMenu: null,
    menuShown: false,

    data: {
        difficultyRatings: [0.5, 1, 2],
        option: 1
    },

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
        
            ctx.font = "40px Monospace";
            ctx.fillStyle = "Black";

            ctx.fillText("Time Waster 3000", 20, 50);
            
            ctx.font = "15px Monospace";
            ctx.fillText("Use arrow keys and enter to navigate menu", 20, 75);

            ctx.font = "25px Monospace";
            ctx.fillText("  ] Start game (easy)", 20, 110);
            ctx.fillText("  ] Start game (normal)", 20, 140);
            ctx.fillText("  ] Start game (hard)", 20, 170);

            if (e.key == "ArrowDown") menu.data.option++;
            else if (e.key == "ArrowUp") menu.data.option--;

            if (menu.data.option < 0) menu.data.option = 0;
            if (menu.data.option > 2) menu.data.option = 2;

            for (let i = 0; i < 3; i++)
            {
                ctx.fillText((i == menu.data.option) ? "[x" : "[ ", 20, 110 + 30 * i);
            }

            if (e.key == "Enter")
            {
                if (menu.data.option >= 0 && menu.data.option <= 2)
                {
                    menu.removeMenu();
                    startKeyDownListen();
                    gameState.begin(menu.data.difficultyRatings[menu.data.option]);
                }
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