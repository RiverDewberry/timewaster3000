const playerStates = {move: 0, dash: 1, dead: 2};

function acceleratePressed() {return keysDown.includes(menu.data.controls.accelerate);}
function deceleratePressed() {return keysDown.includes(menu.data.controls.decelerate);}
function turnLeftPressed() {return keysDown.includes(menu.data.controls.turnLeft);}
function turnRightPressed() {return keysDown.includes(menu.data.controls.turnRight);}
function shootPressed() {return keysDown.includes(menu.data.controls.shoot);}
function dashPressed() {return keysDown.includes(menu.data.controls.dash);}
function exitGamePressed() {return keysDown.includes(menu.data.controls.exitGame);}

const playerTypes = [
    {
        name: "Normal",
        spawn: (g)=>{new Player(g);},
        description: "A normal player."
    },

    {
        name: "Tank",
        spawn: (g)=>{new PlayerTank(g);},
        description: "Slow and hard to kill.\n(Mostly just slow)"
    },

    {
        name: "Hardcore",
        spawn: (g)=>{
            g.gameData.enemySpawner.gameTime = 750 * 40;
            new Player(g);
            g.gameData.player.health *= 0.5;
        },
        description: "Spawn at score 750 with half of max health."
    },

    {
        name: "Strange",
        spawn: (g)=>{new StrangePlayer(g);},
        description: "A normal player with only minor changes :)"
    },

    {
        name: "Glass railgun",
        spawn: (g)=>{new GlassRailgun(g);},
        description: "Are you happy now, Sihoo?"
    },

];

class Player
{
    constructor(gameState)
    {
        this.gameObject = new GameObject(240, 240, 20, 20, this.draw);
        this.gameState = gameState;

        this.deltaX = 0;
        this.deltaY = 0;
        this.angle = 0;
        this.id = null;

        this.acceleration = 0;
        this.maxSpeed = 5;

        this.dashDirection = {x: 0, y: 0};
        this.dashTimer = 0;
        this.dashCount = 0;
        this.maxDash = 3;

        this.ammo = 0;
        this.shotDelaySpeed = 3;
        this.shotDelayTimer = 0;
        this.maxAmmo = 15;

        this.health = 15;
        this.maxhealth = 15;
        this.regenRate = 1;

        this.state = playerStates.move;
        this.slowed = false;

        gameState.addGameObject(this, 0);
        gameState.gameData.player = this;
    }

    update(ctx)
    {
        if (this.state === playerStates.move) this.move();
        else if (this.state === playerStates.dash) this.dash();

        this.shoot();

        if (this.gameObject.x < 0)
        {
            this.gameObject.x = 0;
            this.deltaX = 0;
        }

        if (this.gameObject.y < 0)
        {
            this.gameObject.y = 0;
            this.deltaY = 0;
        }

        if (this.gameObject.x > 480)
        {
            this.gameObject.x = 480;
            this.deltaX = 0;
        }

        if (this.gameObject.y > 480)
        {
            this.gameObject.y = 480;
            this.deltaY = 0;
        }

        this.slowed = false;
        for (let i = 0; i < this.gameState.gameData.enemies.length; i++)
        {
            if (this.gameObject.collidesWith(
                this.gameState.gameData.enemies[i].gameObject
            ) && this.gameState.gameData.enemies[i].canDamagePlayer(this))
            {

                if (this.gameState.gameData.enemies[i].type === enemyTypes.dashLine)
                {
                    this.slowed = true;
                } else {
                    this.takeDamage(this.gameState.gameData.enemies[i].damage);
                    this.gameState.gameData.enemies[i].killEnemy();
                }
            }
        }

        if (this.health > 0)
        {
            if (this.health < this.maxhealth)
            {
                this.health += 0.002 * this.regenRate;
            }
            else this.health = this.maxhealth;
        }

        if (exitGamePressed())
        {
            this.health = -1;
            gameState.end();
        }

        this.gameObject.update(ctx, this);
    }

    takeDamage(amount)
    {
        this.health -= amount;
        if (this.health <= 0)
        {
            this.health = 0;
            this.gameState.end();
        }
    }

    turn()
    {
        if (turnLeftPressed()) this.angle -= 10 /
            (0.75 + this.acceleration * 1.25) * Math.PI / 180;
        if (turnRightPressed()) this.angle += 10 /
            (0.75 + this.acceleration * 1.25) * Math.PI / 180;
    }

    accelerate()
    {
        this.deltaX *= 0.995;
        this.deltaY *= 0.995;
        if (this.acceleration > 1) this.acceleration = 1;
        
        if (acceleratePressed()) this.acceleration += 0.15;
        else this.acceleration = 0;

        if (deceleratePressed())
        {
            this.acceleration *= 0.65;
            this.acceleration -= 0.01;

            this.deltaX *= 0.85;
            this.deltaY *= 0.85;

            if (this.acceleration < 0) this.acceleration = 0;
        }
    }

    move()
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

    shoot()
    {
        if (shootPressed() && (this.shotDelayTimer <= 0) && (this.ammo > 0))
        {
            new Bullet(this.gameState, this);
            this.ammo -= 1;
            this.shotDelayTimer = this.shotDelaySpeed;
        } else {
            this.shotDelayTimer -= 1;

            if (this.ammo < this.maxAmmo)
            {
                this.ammo += Math.max(0, -1 * this.shotDelayTimer * 0.002);
            } else {
                this.ammo = this.maxAmmo;
            }
        }
    }

    dash()
    {
        this.gameObject.x += (15 - this.dashTimer) * this.dashDirection.x;
        this.gameObject.y += (15 - this.dashTimer) * this.dashDirection.y;
        this.deltaX = 5 * this.dashDirection.x;
        this.deltaY = 5 * this.dashDirection.y;

        if (turnLeftPressed()) this.angle -= Math.PI / 20;
        if (turnRightPressed()) this.angle += Math.PI / 20;

        this.dashTimer += 1;
        if (this.dashTimer >= 10)
        {
            if (this.gameObject.x < 0) {this.gameObject.x = 0; this.deltaX = 0;}
            if (this.gameObject.y < 0) {this.gameObject.y = 0; this.deltaY = 0;}
            if (this.gameObject.x > 480) {this.gameObject.x = 480; this.deltaX = 0;}
            if (this.gameObject.y > 480) {this.gameObject.y = 480; this.deltaY = 0;}
            this.state = playerStates.move;
            this.dashTimer = 0;
            this.deltaX = 5 * this.dashDirection.x;
            this.deltaY = 5 * this.dashDirection.y;
            this.findDashDirection();

            if (dashPressed() && this.dashCount >= 1)
            {
                this.state = playerStates.dash;
                this.dashCount -= 1;
                this.dashTimer = 0;
                new DashEffect(this.gameState, this);
            }
        }
    }

    findDashDirection()
    {
        if (Math.abs(Math.cos(this.angle)) > Math.abs(Math.sin(this.angle)))
        {
            if (Math.cos(this.angle) > 0)
            {
                this.dashDirection.x = 1;
                this.dashDirection.y = 0;
            } else {
                this.dashDirection.x = -1;
                this.dashDirection.y = 0;
            }
        } else {
            if (Math.sin(this.angle) > 0)
            {
                this.dashDirection.x = 0;
                this.dashDirection.y = 1;
            } else {
                this.dashDirection.x = 0;
                this.dashDirection.y = -1;
            }
        }
    }

    draw(ctx, data)
    {
        if (data.health <= 0) return;
        ctx.strokeStyle = "Lightgrey";
        ctx.lineWidth = 0.2 * data.gameObject.width;

        ctx.strokeRect(
            data.gameObject.x - data.gameObject.width * 0.5,
            data.gameObject.y - data.gameObject.width * 0.5,
            data.gameObject.width * 2,
            data.gameObject.height * 2
        );

        if (data.state !== playerStates.dash)
        {
            ctx.fillStyle = "Black";
            ctx.fillRect(
                data.gameObject.x,
                data.gameObject.y,
                data.gameObject.width,
                data.gameObject.height
            );
            
            if (data.health > 0)
            {
                ctx.fillStyle = "Red";

                let size = data.health / data.maxhealth;

                ctx.fillRect(
                    data.gameObject.x + data.gameObject.height * (1 - size) * 0.5,
                    data.gameObject.y + data.gameObject.width * (1 - size) * 0.5,
                    data.gameObject.width * size,
                    data.gameObject.height * size
                );
            }

        } else {
            
            let scaledHealth = data.health * 150 / data.maxhealth;
            ctx.strokeStyle = "rgb(" + Math.round(scaledHealth + 105) + ", 105, 105)";
            ctx.lineWidth = 8;
            ctx.strokeRect(
                data.gameObject.x,
                data.gameObject.y,
                data.gameObject.width,
                data.gameObject.height
            );
        }

        if (data.maxDash != 0)
        {
            let scaledDash = data.dashCount / data.maxDash;
            ctx.fillStyle = "rgb(" +
            ((1 - scaledDash) * 211) + "," +
            (211 + 44 * scaledDash) + "," +
            ((1 - scaledDash) * 211) + ")";
        } else ctx.fillStyle = "rgb(211, 211, 211)";

        ctx.fillRect(
            data.gameObject.x + data.gameObject.width * 
                (0.4 + data.dashDirection.x - Math.abs(data.dashDirection.y)),
            data.gameObject.y + data.gameObject.width *
                (0.4 + data.dashDirection.y - Math.abs(data.dashDirection.x)),
            data.gameObject.width * (0.2 + 2 * Math.abs(data.dashDirection.y)),
            data.gameObject.height * (0.2 + 2 * Math.abs(data.dashDirection.x))
        );

        let xDirection = Math.cos(data.angle);
        let yDirection = Math.sin(data.angle);
        let directionScale = Math.max(Math.abs(xDirection), Math.abs(yDirection));
        xDirection /= directionScale;
        yDirection /= directionScale;

        if (data.maxAmmo != 0)
        {
            if (data.ammo !== data.maxAmmo)
            {
                let dotScale = 3 * Math.max(0, data.shotDelayTimer) / data.shotDelaySpeed;
                ctx.fillRect(
                    data.gameObject.x + data.gameObject.width * 
                        (0.3 + xDirection - 0.05 * dotScale),
                    data.gameObject.y + data.gameObject.width *
                        (0.3 + yDirection - 0.05 * dotScale),
                    data.gameObject.width * (0.4 + 0.1 * dotScale),
                    data.gameObject.height * (0.4 + 0.1 * dotScale)
                );
            }

            ctx.fillStyle = "#00f";
            let scaledAmmo = data.ammo / data.maxAmmo;
            ctx.fillRect(
                data.gameObject.x + data.gameObject.width *
                (0.5 - (scaledAmmo * 0.2) + xDirection),
                data.gameObject.y + data.gameObject.width *
                (0.5 - (scaledAmmo * 0.2) + yDirection),
                data.gameObject.width * 0.4 * scaledAmmo,
                data.gameObject.height * 0.4 * scaledAmmo
            );
        }
    }
}

class DashEffect
{
    constructor(gameState, player)
    {
        this.gameState = gameState;
        this.gameObject = new GameObject(
            player.gameObject.x + 0.4 * player.gameObject.width,
            player.gameObject.y + 0.4 * player.gameObject.width,
            0.2 * player.gameObject.width, 0.2 * player.gameObject.width,
            this.draw
        );

        this.timer = 0;
        this.kill = false;

        this.direction = {x: player.dashDirection.x, y: player.dashDirection.y};

        this.gameState.gameData.dashlines.push(this);
        gameState.addGameObject(this, 4);
   }

    update(ctx)
    {   
        if (this.timer < 10)
        {
            this.gameObject.width += Math.abs((15 - this.timer) * this.direction.x);
            this.gameObject.height += Math.abs((15 - this.timer) * this.direction.y);

            if ((15 - this.timer) * this.direction.x < 0)
            {
                this.gameObject.x += (15 - this.timer) * this.direction.x;
            }

            if ((15 - this.timer) * this.direction.y < 0)
            {
                this.gameObject.y += (15 - this.timer) * this.direction.y;
            }
        }

        if (this.timer >= 100)
        {
            this.gameObject.width -= Math.abs((95 - this.timer) * this.direction.x);
            this.gameObject.height -= Math.abs((95 - this.timer) * this.direction.y);

            if ((15 - this.timer) * this.direction.x < 0)
            {
                this.gameObject.x -= (95 - this.timer) * this.direction.x;
            }

            if ((15 - this.timer) * this.direction.y < 0)
            {
                this.gameObject.y -= (95 - this.timer) * this.direction.y;
            }
        }

        if (this.timer === 110) this.killDash();

        this.timer += 1;

        this.gameObject.update(ctx, this);
    }

    draw(ctx, data)
    {
        ctx.fillStyle = "Lightgray";

        ctx.fillRect(
            data.gameObject.x,
            data.gameObject.y,
            data.gameObject.width,
            data.gameObject.height
        );
    }

    killDash()
    {
        this.kill = true;
        for (let i = 0; i < this.gameState.gameData.dashlines.length; i++)
        {
            if (this.gameState.gameData.dashlines[i].id === this.id)
            {
                this.gameState.gameData.dashlines.splice(i, 1);
                return;
            }
        }
    }

}

class Bullet
{
    constructor(gameState, player)
    {
        let xDirection = Math.cos(player.angle);
        let yDirection = Math.sin(player.angle);
        let directionScale = Math.max(Math.abs(xDirection), Math.abs(yDirection));
        xDirection /= directionScale;
        yDirection /= directionScale;

        this.deltaX = Math.cos(player.angle) * 7.5;
        this.deltaY = Math.sin(player.angle) * 7.5;

        if (player.state === playerStates.dash)
        {
            this.deltaX +=  (15 - player.dashTimer) * player.dashDirection.x;
            this.deltaY +=  (15 - player.dashTimer) * player.dashDirection.y;
        } else {
            if (player.slowed)
            {
                this.deltaX += player.deltaX * 0.2;
                this.deltaY += player.deltaY * 0.2;
            } else {
                this.deltaX += player.deltaX;
                this.deltaY += player.deltaY;
            }
        }

        this.deltaTotal = Math.sqrt(
            this.deltaX * this.deltaX +
            this.deltaY * this.deltaY
        );

        if (this.deltaTotal < 1)
        {
            this.deltaTotal = 1;
            this.deltaX /= this.deltaTotal;
            this.deltaY /= this.deltaTotal;
        }

        this.gameState = gameState;
        this.gameObject = new GameObject(
            player.gameObject.x + (0.5 + xDirection) * player.gameObject.width - this.deltaTotal,
            player.gameObject.y + (0.5 + yDirection) * player.gameObject.width - this.deltaTotal,
            this.deltaTotal * 2,
            this.deltaTotal * 2,
            this.draw
        );

        this.displayBullet = new GameObject(
            player.gameObject.x + (0.4 + xDirection) * player.gameObject.width,
            player.gameObject.y + (0.4 + yDirection) * player.gameObject.width,
            player.gameObject.width * 0.2,
            player.gameObject.width * 0.2,
            this.draw
        );

        gameState.addGameObject(this, 1);
        gameState.gameData.bullets.push(this);
    }

    update(ctx)
    {
        if (Math.sqrt(this.deltaX * this.deltaX + this.deltaY * this.deltaY) < 1)
        {
            this.killBullet();
            return;
        }

        this.gameObject.x += this.deltaX;
        this.gameObject.y += this.deltaY;
        
        this.displayBullet.x += this.deltaX;
        this.displayBullet.y += this.deltaY;

        if ((this.gameObject.x < (-1 * this.gameObject.width)) ||
            (this.gameObject.y < (-1 * this.gameObject.height)) ||
            (this.gameObject.x > (this.gameObject.width + 500)) ||
            (this.gameObject.y > (this.gameObject.height + 500))
        )
            this.killBullet();

        this.gameObject.update(ctx, this);
    }

    draw(ctx, data)
    {
        ctx.strokeStyle = "Lightgrey";
        ctx.lineWidth = 4;
        ctx.strokeRect(
            data.gameObject.x,
            data.gameObject.y,
            data.gameObject.width,
            data.gameObject.height
        );

        ctx.fillStyle = "Gray";
        ctx.fillRect(
            data.displayBullet.x,
            data.displayBullet.y,
            data.displayBullet.width,
            data.displayBullet.height
        );

    }

    killBullet()
    {
        this.kill = true;
        for (let i = 0; i < this.gameState.gameData.bullets.length; i++)
        {
            if (this.gameState.gameData.bullets[i].id === this.id)
            {
                this.gameState.gameData.bullets.splice(i, 1);
                return;
            }
        }
    }    
}

class PlayerTank extends Player
{
    constructor(gameState)
    {
        super(gameState);

        this.health = 20;
        this.maxhealth = 20;
        this.maxDash = 1;
        this.maxAmmo = 20;
        this.maxSpeed = 3;
        this.regenRate = 1.5;
    }
}

class GlassRailgun extends Player
{
    constructor(gameState)
    {
        super(gameState);
        this.health = 10;
        this.maxhealth = 10;
        this.maxAmmo = 5;
        this.maxDash = 1;
    }

    turn()
    {
        if (turnLeftPressed()) this.angle -= 10 * Math.PI / 180;
        if (turnRightPressed()) this.angle += 10 * Math.PI / 180;
    }

    dash()
    {
        this.dashTimer += 1;
        this.move();
        if (this.dashTimer >= 20)
        {
            this.state = playerStates.move;
            this.dashTimer = 0;
        }
    }

    accelerate()
    {
        if (this.acceleration > 1) this.acceleration = 1;
        
        if (acceleratePressed()) this.acceleration += 0.15;
        else this.acceleration = 0;

        if (deceleratePressed())
        {
            this.acceleration *= 0.65;
            this.acceleration -= 0.01;

            this.deltaX *= 0.85;
            this.deltaY *= 0.85;

            if (this.acceleration < 0) this.acceleration = 0;
        }
    }

    move()
    {
        if (this.state !== playerStates.dash)
        {
            if (dashPressed() && this.dashCount >= 1)
            {
                this.dashCount -= 1;
                this.dashTimer = 0;
                this.state = playerStates.dash;
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

        this.findDashDirection();

        this.gameObject.x += this.deltaX * ((this.slowed) ? 0.2 : 1);
        this.gameObject.y += this.deltaY * ((this.slowed) ? 0.2 : 1);
    }
}

class StrangePlayer extends Player
{
    constructor(gameState)
    {
        super(gameState);
    }

    accelerate()
    {
        this.deltaX *= 0.995;
        this.deltaY *= 0.995;
        if (this.acceleration > 1) this.acceleration = 1;
        
        if (
            (acceleratePressed() ||
            deceleratePressed() ||
            turnLeftPressed() ||
            turnRightPressed()) &&
            (this.angle === this.targetAngle)
        ) this.acceleration += 0.15;
        else this.acceleration = 0;
    }

    turn()
    {
        this.targetAngle = 0;
        this.pressCount = 0;
        if (deceleratePressed()) this.targetAngle += Math.PI * 0.5, this.pressCount++;
        if (acceleratePressed()) this.targetAngle += Math.PI * 1.5, this.pressCount++;
        if (turnLeftPressed()) this.targetAngle += Math.PI, this.pressCount++;
        if (turnRightPressed()) this.targetAngle += 0, this.pressCount++;

        if (this.pressCount === 0) return;

        if (acceleratePressed() && turnRightPressed() && this.pressCount === 2)
            this.targetAngle = Math.PI * 1.75;
        else this.targetAngle /= this.pressCount;

        if (this.angle === this.targetAngle) return;

        if (this.angle < 0) this.angle += 2 * Math.PI;

        if (Math.abs(this.angle - this.targetAngle) < Math.PI)
        {
            if (this.targetAngle < this.angle) this.angle -= 0.333;
            else this.angle += 0.333;
        } else {
            if (this.targetAngle < this.angle) this.angle += 0.333;
            else this.angle -= 0.333;
        }

        if (this.angle < 0) this.angle += 2 * Math.PI; 
        if (this.angle > (2 * Math.PI)) this.angle -= 2 * Math.PI;

        if (Math.abs(this.angle - this.targetAngle) <= 0.334) this.angle = this.targetAngle;
    }

    dash()
    {
        this.gameObject.x += (15 - this.dashTimer) * this.dashDirection.x;
        this.gameObject.y += (15 - this.dashTimer) * this.dashDirection.y;
        this.deltaX = 5 * this.dashDirection.x;
        this.deltaY = 5 * this.dashDirection.y;

        this.turn();
        this.turn();

        this.dashTimer += 1;
        if (this.dashTimer >= 10)
        {
            if (this.gameObject.x < 0) {this.gameObject.x = 0; this.deltaX = 0;}
            if (this.gameObject.y < 0) {this.gameObject.y = 0; this.deltaY = 0;}
            if (this.gameObject.x > 480) {this.gameObject.x = 480; this.deltaX = 0;}
            if (this.gameObject.y > 480) {this.gameObject.y = 480; this.deltaY = 0;}
            this.state = playerStates.move;
            this.dashTimer = 0;
            this.deltaX = 5 * this.dashDirection.x;
            this.deltaY = 5 * this.dashDirection.y;
            this.findDashDirection();

            if (dashPressed() && this.dashCount >= 1)
            {
                this.state = playerStates.dash;
                this.dashCount -= 1;
                this.dashTimer = 0;
                new DashEffect(this.gameState, this);
            }
        }
    }
}