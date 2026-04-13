class TutorialPlayer extends Player
{
    constructor (gameState)
    {
        super(gameState);
        this.canTurn = false;
        this.canAccelerate = false;
        this.canShoot = false;
        this.canDash = false;

        this.dashCount = 3;
        this.ammo = 15;

        this.exitWasPressed = false;
    }

    turn()
    {
        if (this.canTurn) super.turn();
    }

    accelerate()
    {
        if (this.canAccelerate) super.accelerate();
    }

    shoot()
    {
        if (this.canShoot) super.shoot();
    }

    move()
    {
        if (this.canDash)
        {
            if (dashPressed() && this.dashCount >= 1)
            {
                this.state = playerStates.dash;
                this.dashCount -= 1;
                this.dashTimer = 0;
                new DashEffect(this.gameState, this);
                this.dash();
                return;
            } else {
                this.dashTimer += 0.002;
                this.dashCount += this.dashTimer * 1 / (0.25 + Math.sqrt(
                    this.deltaX * this.deltaX + this.deltaY * this.deltaY
                ));
                if (this.dashCount > this.maxDash) this.dashCount = this.maxDash;
            }
        }

        this.accelerate();

        this.turn();
        
        this.deltaX += Math.cos(this.angle) * this.acceleration;
        this.deltaY += Math.sin(this.angle) * this.acceleration;

        let velocityMag = Math.sqrt(this.deltaX * this.deltaX + this.deltaY * this.deltaY);

        if (velocityMag > this.maxSpeed)
        {
            this.deltaX /= velocityMag / this.maxSpeed;
            this.deltaY /= velocityMag / this.maxSpeed;
        }

        this.findDashDirection();

        this.gameObject.x += this.deltaX * ((this.slowed) ? 0.2 : 1);
        this.gameObject.y += this.deltaY * ((this.slowed) ? 0.2 : 1);
    }

    handleExit()
    {
        if (exitGamePressed() && (!this.exitWasPressed)) 
        {
            this.gameState.gameData.tutorialManager.tutorialStage++;
            this.gameState.gameData.tutorialManager.updateStage();
        }

        this.exitWasPressed = exitGamePressed();
    }
}

class TutorialManager
{
    constructor(gameState)
    {
        this.gameState = gameState;

        this.tutorialStage = 0;

        gameState.addGameObject(this, 5);
        gameState.gameData.tutorialManager = this;
    }

    updateStage()
    {
        switch (this.tutorialStage)
        {
            case 1:
                this.gameState.gameData.player.canTurn = true;
                break;

            case 2:
                this.gameState.gameData.player.canAccelerate = true;
                break;

            case 3:
                this.gameState.gameData.player.canShoot = true;
                break;

            case 4:
                this.gameState.gameData.player.canDash = true;
                break;

            case 6:
                clearInterval(this.gameState.intervalTracker);
                this.gameState.running = false;
                this.gameState.gameData.player.health = -1;
                menu.switchMenu(menu.startGameMenu);
                break;

            default:
                break;
        }
    }

    update(ctx)
    {
        this.draw(this, ctx)
    }

    draw(data, ctx)
    {
        ctx.font = "25px Monospace";
        ctx.fillStyle = "Black";

        switch (data.tutorialStage)
        {
            case 0:
                ctx.fillText("Welcome to Time Waster 3000", 20, 40);
                ctx.font = "15px Monospace";
                ctx.fillText("Press [" + menu.data.controls.exitGame + "] to continue", 20, 70);
                break;
            
            case 1:
                ctx.fillText("Movement part 1: rotation", 20, 40);
                ctx.font = "15px Monospace";
                ctx.fillText("Hold [" + menu.data.controls.turnLeft + "] to turn left", 20, 70);
                ctx.fillText("Hold [" + menu.data.controls.turnRight + "] to turn right",
                    20, 90);
                ctx.fillText("Press [" + menu.data.controls.exitGame + "] to continue", 20, 130);
                break;

            case 2:
                ctx.fillText("Movement part 2: acceleration", 20, 40);
                ctx.font = "15px Monospace";
                ctx.fillText("Hold [" + menu.data.controls.accelerate + "] to accelerate" +
                    " in your direction", 20, 70);
                ctx.fillText("Hold [" + menu.data.controls.decelerate + "] to slow down",
                    20, 90);
                ctx.fillText("Note: Your velocity only changes when you accelerate;", 20, 130);
                ctx.fillText("turning does not automatically change your velocity.", 20, 150);
                ctx.fillText("Press [" + menu.data.controls.exitGame + "] to continue", 20, 190);
                break;

            case 3:
                ctx.fillText("Shooting", 20, 40);
                ctx.font = "15px Monospace";
                ctx.fillText("Press [" + menu.data.controls.shoot + "] to shoot" +
                    " in your direction", 20, 70);
                ctx.fillText("Note: Bullet damage is based on bullet velocity, and", 20, 110);
                ctx.fillText("bullets will inherit your velocity.", 20, 130);
                ctx.fillText("Note: Ammo regenerates faster when you don't shoot.", 20, 150);
                ctx.fillText("Note: The player's blue dot is an ammo indicator.", 20, 170);
                ctx.fillText("Press [" + menu.data.controls.exitGame + "] to continue", 20, 210);
                break;

            case 4:
                ctx.fillText("Dashing", 20, 40);
                ctx.font = "15px Monospace";
                ctx.fillText("Press [" + menu.data.controls.dash + "] to dash" +
                    " in your direction", 20, 70);
                ctx.fillText("Note: When you dash, you are immune to damage.", 20, 110);
                ctx.fillText("Note: Your dash trail has an effect on enemies.", 20, 130);
                ctx.fillText("Note: Dash regenerates faster when you move slower.", 20, 150);
                ctx.fillText("Note: The player's green bar is a dash indicator.", 20, 170);
                ctx.fillText("Press [" + menu.data.controls.exitGame + "] to continue", 20, 210);
                break;

            case 5:
                ctx.fillText("End of tutorial", 20, 40);
                ctx.font = "15px Monospace";
                ctx.fillText("Press [" + menu.data.controls.pause + "] to pause game", 20, 70);
                ctx.fillText("Note: Health is indicated by how red the player is.", 20, 110);
                ctx.fillText("Press [" + menu.data.controls.exitGame + "] to exit", 20, 150);
                break;

            default: break;
        }
    }

}