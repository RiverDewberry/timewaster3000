const canvas = document.getElementById("gameCanvas");
canvas.width = 500;
canvas.height = 500;
const ctx = canvas.getContext("2d");

const menu = {

    currentMenu: null,
    menuShown: false,

    data: {
        difficultyRatings: [0.5, 1, 2],
        option: 0,
        controls: {
            accelerate: "ArrowUp",
            decelerate: "ArrowDown",
            turnLeft: "ArrowLeft",
            turnRight: "ArrowRight",
            shoot: " ",
            dash: "x",
            pause: "p",
            exitGame: "Escape"
        }
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
            menu.data.option = 1;
            menu.startGameMenu.loop({key: ""});
        },

        loop: function(e)
        {
            ctx.clearRect(0, 0, 500, 500);
        
            ctx.font = "40px Monospace";
            ctx.fillStyle = "Black";

            ctx.fillText("Time Waster 3000", 20, 50);
            
            ctx.font = "15px Monospace";
            ctx.fillText("Use arrow keys and enter to navigate menu", 20, 75);

            ctx.font = "25px Monospace";
            ctx.fillText("  ] Start game (easy)", 20, 110);
            ctx.fillText("  ] Start game (normal)", 20, 140);
            ctx.fillText("  ] Start game (hard)", 20, 170);
            ctx.fillText("  ] View/edit controls", 20, 200);

            if (e.key == "ArrowDown") menu.data.option++;
            else if (e.key == "ArrowUp") menu.data.option--;

            if (menu.data.option < 0) menu.data.option = 0;
            if (menu.data.option > 2) menu.data.option = 3;

            for (let i = 0; i < 4; i++)
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
                } else menu.switchMenu(menu.controlsMenu);
            }
        }
    },

    controlsMenu: {
        enter: function()
        {
            menu.data.option = 0;
            menu.controlsMenu.loop({key: ""});
        },

        loop: function(e)
        {
            for (elem in menu.data.controls)
            {
                if (menu.data.controls[elem] === "Enter a key")
                {
                    menu.data.controls[elem] = e.key;
                    e = {key: ""};
                    break;
                }
            }

            ctx.clearRect(0, 0, 500, 500);
        
            ctx.font = "40px Monospace";
            ctx.fillStyle = "Black";

            ctx.fillText("Time Waster 3000", 20, 50);
            
            ctx.font = "15px Monospace";
            ctx.fillText("Use arrow keys and enter to navigate menu", 20, 75);

            if (e.key == "ArrowDown") menu.data.option++;
            else if (e.key == "ArrowUp") menu.data.option--;

            if (menu.data.option < 0) menu.data.option = 0;
            if (menu.data.option > 7) menu.data.option = 8;

            if (e.key == "Enter")
            {
                if (menu.data.option == 0)
                {
                    startKeyDownListen();
                    menu.switchMenu(menu.startGameMenu);
                    return;
                } else switch (menu.data.option)
                {
                    case 1:
                        menu.data.controls.accelerate = "Enter a key";
                        break;
                    case 2:
                        menu.data.controls.decelerate = "Enter a key";
                        break;
                    case 3:
                        menu.data.controls.turnLeft = "Enter a key";
                        break;
                    case 4:
                        menu.data.controls.turnRight = "Enter a key";
                        break;
                    case 5:
                        menu.data.controls.shoot = "Enter a key";
                        break;
                    case 6:
                        menu.data.controls.dash = "Enter a key";
                        break;
                    case 7:
                        menu.data.controls.pause = "Enter a key";
                        break;
                    case 8:
                        menu.data.controls.exitGame = "Enter a key";
                        break;
                    default:
                        break;
                }
            }

            ctx.font = "25px Monospace";

            ctx.fillText((menu.data.option == 0) ? "[x" : "[ ", 20, 110);
            if (menu.data.option > 0) ctx.fillText("(edit)", 20, 140 + 30 * menu.data.option);

            ctx.fillText("  ] Back to main menu", 20, 110);
            ctx.fillText("       accelerate: [" +
                menu.data.controls.accelerate + "]", 20, 170);
            ctx.fillText("       decelerate: [" +
                menu.data.controls.decelerate + "]", 20, 200);
            ctx.fillText("       turn left : [" +
                menu.data.controls.turnLeft + "]", 20, 230);
            ctx.fillText("       turn right: [" +
                menu.data.controls.turnRight + "]", 20, 260);
            ctx.fillText("       shoot     : [" +
                menu.data.controls.shoot + "]", 20, 290);
            ctx.fillText("       dash      : [" +
                menu.data.controls.dash + "]", 20, 320);
            ctx.fillText("       pause     : [" +
                menu.data.controls.pause + "]", 20, 350);
            ctx.fillText("       exit game : [" +
                menu.data.controls.exitGame + "]", 20, 380);
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
            if (e.key == menu.data.controls.pause)
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

            ctx.strokeText(((gameState.gameData.player.health == 0) ? "You died" : "Game ended") +
                " with a score of " +
                Math.round(gameState.gameData.enemySpawner.gameTime / 40), 20, 50);
            ctx.strokeText("Press [Enter] to continue", 20, 100);

            ctx.fillText(((gameState.gameData.player.health == 0) ? "You died" : "Game ended") +
                " with a score of " +
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