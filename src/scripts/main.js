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
        suboption: 0,
        suboptionNum: 1,
        controls: {
            accelerate: "ArrowUp",
            decelerate: "ArrowDown",
            turnLeft: "ArrowLeft",
            turnRight: "ArrowRight",
            shoot: "Space",
            dash: "x",
            pause: "p",
            exitGame: "Escape"
        },
        playerType: 0
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

    menuGame: {
        enter: function()
        {
            menu.removeMenu();
            startKeyDownListen();
            menuPlayer.start();
        },

        loop: function()
        {
            ctx.clearRect(0, 0, 500, 500);
            
            ctx.font = "40px Monospace";
            ctx.fillStyle = "Black";

            ctx.fillText("Time Waster 3000", 20, 50);
            
            ctx.font = "15px Monospace";
            ctx.fillText("https://riverdewberry.dev", 20, 460);
            ctx.fillText("No AI was used in the creation of this game.", 20, 480);
            ctx.fillStyle = "#f00";
            ctx.fillText("Use arrow keys and enter to navigate menu", 20, 75);
            ctx.fillText("[" + menu.data.controls.exitGame + "] to return", 20, 230);
            ctx.font = "25px Monospace";
            ctx.fillStyle = "#000";

            ctx.fillText("[ ] Start:  easy  normal  hard", 20, 110);
            ctx.fillText("[ ] Tutorial", 20, 140);
            ctx.fillText("[ ] View/edit controls", 20, 170);
            ctx.fillText("[ ] Select player type", 20, 200);
        }
    },

    startGameMenu: {
        enter: function()
        {
            endKeyDownListen();
            menu.data.option = 0;
            menu.data.suboption = 1;
            menu.data.suboptionNum = 3;
            menu.startGameMenu.loop({key: ""});
        },

        loop: function(e)
        {
            ctx.clearRect(0, 0, 500, 500);
        
            ctx.font = "40px Monospace";
            ctx.fillStyle = "Black";

            ctx.fillText("Time Waster 3000", 20, 50);
            
            ctx.font = "15px Monospace";
            ctx.fillText("https://riverdewberry.dev", 20, 460);
            ctx.fillText("No AI was used in the creation of this game.", 20, 480);
            ctx.fillStyle = "#f00";
            ctx.fillText("Use arrow keys and enter to navigate menu", 20, 75);
            ctx.font = "25px Monospace";
            ctx.fillStyle = "#000";

            ctx.fillText("  ] Start:  easy  normal  hard", 20, 110);
            ctx.fillText("  ] Tutorial", 20, 140);
            ctx.fillText("  ] View/edit controls", 20, 170);
            ctx.fillText("  ] Select player type", 20, 200);

            let prevOption = menu.data.option;

            if (e.key === "ArrowDown") menu.data.option++;
            else if (e.key === "ArrowUp") menu.data.option--;

            if (menu.data.option === -1) menu.data.option += 1;
            if (menu.data.option === 5) menu.data.option -= 1;

            if (menu.data.option === 0)
            {
                if (prevOption !== 0)
                {
                    menu.data.suboptionNum = 3;
                    menu.data.suboption = 1;
                }
            } else menu.data.suboptionNum = 1;

            if (e.key === "ArrowRight") menu.data.suboption++;
            else if (e.key === "ArrowLeft") menu.data.suboption--;

            if (menu.data.suboption === -1) menu.data.suboption += 1;
            if (menu.data.suboption === menu.data.suboptionNum) menu.data.suboption -= 1;

            for (let i = 0; i < 4; i++)
            {
                ctx.fillText((i === menu.data.option) ? "[x" : "[ ", 20, 110 + 30 * i);
            }

            if (menu.data.option === 4) menuPlayer.health = menuPlayer.maxHealth * 0.667;
            else menuPlayer.health = menuPlayer.maxHealth * 0.333;

            if (menu.data.option === 0)
            {
                switch (menu.data.suboption)
                {
                    case 0:
                        ctx.fillText("           <    >", 20, 110);
                        break;

                    case 1:
                        ctx.fillText("                 <      >", 20, 110);
                        break;

                    case 2:
                        ctx.fillText("         :               <    >", 20, 110);
                        break;
                }
            }

            menuPlayer.draw(ctx, menuPlayer);

            if (e.key === "Enter")
            {
                if (menu.data.option === 0)
                {
                    menu.removeMenu();
                    startKeyDownListen();
                    gameState.begin(
                        menu.data.difficultyRatings[menu.data.suboption],
                        menu.data.playerType
                    );
                } else if (menu.data.option === 1)
                {
                    menu.removeMenu();
                    startKeyDownListen();
                    gameState.beginTutorial();
                } else if (menu.data.option === 2) {
                    menu.switchMenu(menu.controlsMenu);
                } else if (menu.data.option === 3){
                    menu.switchMenu(menu.playerSelectionMenu);
                } else if (menu.data.option == 4)
                {
                    menu.menuGame.enter();
                }
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
                    menu.data.controls[elem] = (e.key === " ") ? "Space" : e.key;

                    for (elem2 in menu.data.controls)
                    {
                        if (elem2 === elem) continue;

                        if (menu.data.controls[elem2] === menu.data.controls[elem])
                            menu.data.controls[elem2] = "Enter a key"
                    }

                    e = {key: ""};
                    break;
                }
            }

            ctx.clearRect(0, 0, 500, 500);
        
            ctx.font = "40px Monospace";
            ctx.fillStyle = "Black";

            ctx.fillText("Time Waster 3000", 20, 50);
            
            ctx.font = "15px Monospace";
            ctx.fillText("https://riverdewberry.dev", 20, 460);
            ctx.fillText("No AI was used in the creation of this game.", 20, 480);
            ctx.fillStyle = "#f00";
            ctx.fillText("Use arrow keys and enter to navigate menu", 20, 75);
            ctx.font = "25px Monospace";
            ctx.fillStyle = "#000";

            if (e.key === "ArrowDown") menu.data.option++;
            else if (e.key === "ArrowUp") menu.data.option--;

            if (menu.data.option < 0) menu.data.option = 0;
            if (menu.data.option > 7) menu.data.option = 8;

            if (e.key === "Enter")
            {
                if (menu.data.option === 0)
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

            ctx.fillText((menu.data.option === 0) ? "[x" : "[ ", 20, 110);
            if (menu.data.option > 0) ctx.fillText("(edit)", 20, 140 + 30 * menu.data.option);
            else ctx.fillText(" V", 20, 140);

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

    playerSelectionMenu: {
        enter: function()
        {
            menu.data.option = 0;
            menu.data.suboption = menu.data.playerType;
            menu.playerSelectionMenu.loop({key: ""});
        },

        loop: function(e)
        {
            ctx.clearRect(0, 0, 500, 500);
        
            ctx.font = "40px Monospace";
            ctx.fillStyle = "Black";

            ctx.fillText("Time Waster 3000", 20, 50);
            
            ctx.font = "15px Monospace";
            ctx.fillText("https://riverdewberry.dev", 20, 460);
            ctx.fillText("No AI was used in the creation of this game.", 20, 480);
            ctx.fillStyle = "#f00";
            ctx.fillText("Use arrow keys and enter to navigate menu", 20, 75);
            ctx.font = "25px Monospace";
            ctx.fillStyle = "#000";

            if (e.key === "ArrowDown") menu.data.option++;
            else if (e.key === "ArrowUp") menu.data.option--;

            if (menu.data.option < 0) menu.data.option = 0;
            if (menu.data.option > 1) menu.data.option = 1;

            ctx.fillText((menu.data.option === 0) ? "[x" : "[ ", 20, 110);
            ctx.fillText((menu.data.option === 0) ? " V" : "", 20, 140);
            ctx.fillText((menu.data.option === 1) ? "  x" : "", 20, 380);

            ctx.fillText("  ] Back to main menu", 20, 110);

            if (e.key === "Enter")
            {
                if (menu.data.option === 0)
                {
                    startKeyDownListen();
                    menu.switchMenu(menu.startGameMenu);
                    return;
                } else menu.data.playerType = menu.data.suboption;
            }

            if (e.key === "ArrowLeft")
            {
                if (menu.data.suboption > 0) menu.data.suboption--;
            } else if (e.key === "ArrowRight")
            {
                if ((menu.data.suboption + 1) < playerTypes.length) menu.data.suboption++;   
            }

            ctx.fillText("Type: " + playerTypes[menu.data.suboption].name + " {" + (
                    (menu.data.suboption === menu.data.playerType) ? "x" : " "
                ) + "}", 20, 200);

            ctx.fillText("Description: ", 20, 260);

            ctx.fillText(
                "<- -> (" + (menu.data.suboption + 1) + "/" + playerTypes.length + ")" +
                " Select" + ((menu.data.suboption === menu.data.playerType) ? "ed" : "")
                + " type",
                20, 380);
            ctx.fillText("  ] Back to main menu", 20, 110);

            ctx.font = "15px Monospace";

            const tempText = playerTypes[menu.data.suboption].description.split("\n");
            
            for (let i = 0; i < tempText.length; i++) {
                ctx.fillText(tempText[i], 20, 290 + 20 * i);
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

            let tempText = "(Paused)";

            ctx.strokeText(tempText, 20, 90);
            ctx.fillText(tempText, 20, 90);
            
            ctx.font = "40px Monospace";
            ctx.fillStyle = "Black";

            ctx.strokeText("Time Waster 3000", 20, 50);
            ctx.fillText("Time Waster 3000", 20, 50);
        },

        loop: function(e)
        {
            if (e.key === menu.data.controls.pause)
            {
                menu.removeMenu();
                startKeyDownListen();
                gameState.resume();
            }

            if (e.key === menu.data.controls.exitGame)
            {
                menu.removeMenu();
                startKeyDownListen();
                gameState.gameData.player.health = -1;
                gameState.tick(gameState);
                menu.switchMenu(menu.deathMenu);
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
            ctx.lineWidth = 4;
            ctx.miterLimit = 2;
            ctx.lineJoin = 'circle';

            ctx.strokeText(((gameState.gameData.player.health === 0) ? "You died" : "Game ended") +
                " with a score of " +
                Math.round(gameState.gameData.enemySpawner.gameTime / 40), 20, 50);
            ctx.strokeText("Press [Enter] to continue", 20, 100);

            ctx.fillText(((gameState.gameData.player.health === 0) ? "You died" : "Game ended") +
                " with a score of " +
                Math.round(gameState.gameData.enemySpawner.gameTime / 40), 20, 50);
            ctx.fillText("Press [Enter] to continue", 20, 100);

            endKeyDownListen();
        },

        loop: function(e)
        {
            if (e.key === "Enter")
            {
                startKeyDownListen();
                menu.switchMenu(menu.startGameMenu);
            }
        }
    }
};

const gameState = new GameState(ctx, 25,
    function() {menu.switchMenu(menu.deathMenu);},
    function() {menu.switchMenu(menu.pauseMenu);}
);

let menuPlayer = new MenuPlayer(gameState);
function menuPlayerLoop()
{
    menuPlayer.update(ctx);
}

menu.switchMenu(menu.startGameMenu);