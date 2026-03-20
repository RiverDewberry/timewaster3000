const playerStates = {move: 0, dash: 1, dead: 2};

class Player
{
    constructor(gameState)
    {
        this.gameObject = new GameObject(240, 240, 20, 20, this.draw);
        this.gameState = gameState;

        this.deltaX = 0;
        this.deltaY = 0;
        this.acceleration = 0;
        this.angle = 0;
        this.id = null;

        this.dashDirection = {x: 0, y: 0};
        this.dashTimer = 0;
        this.dashCount = 0;

        this.ammo = 0;
        this.shotDelayTimer = 0;

        this.health = 15;

        this.state = playerStates.move;
        this.slowed = false;

        gameState.addGameObject(this, 0);
        gameState.gameData.player = this;
    }

    update(ctx)
    {
        if (this.state == playerStates.move) this.move();
        else if (this.state == playerStates.dash) this.dash();

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

                if (this.gameState.gameData.enemies[i].type == enemyTypes.dashLine)
                {
                    this.slowed = true;
                } else {
                    this.takeDamage(this.gameState.gameData.enemies[i].damage);
                    this.gameState.gameData.enemies[i].killEnemy();
                }
            }
        }

        if (this.health < 15)
        {
            this.health += 0.002;
        }
        else this.health = 15;

        this.gameObject.update(ctx, this);
    }

    takeDamage(amount)
    {
        this.health -= amount;
        if (this.health <= 0)
        {
            this.gameState.stop();
        }
    }

    move()
    {
        if (keysDown.includes("x") && this.dashCount >= 1)
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
            if (this.dashCount > 3) this.dashCount = 3;
        }

        this.deltaX *= 0.995;
        this.deltaY *= 0.995;
        if (this.acceleration > 1) this.acceleration = 1;
        
        if (keysDown.includes("ArrowUp")) this.acceleration += 0.15;
        else this.acceleration = 0;

        if (keysDown.includes("ArrowDown"))
        {
            this.acceleration *= 0.65;
            this.acceleration -= 0.01;

            this.deltaX *= 0.85;
            this.deltaY *= 0.85;

            if (this.acceleration < 0) this.acceleration = 0;
        }

        if (keysDown.includes("ArrowLeft")) this.angle -= 10 /
            (0.75 + this.acceleration * 1.25) * Math.PI / 180;
        if (keysDown.includes("ArrowRight")) this.angle += 10 /
            (0.75 + this.acceleration * 1.25) * Math.PI / 180;
        
        this.deltaX += Math.cos(this.angle) * this.acceleration;
        this.deltaY += Math.sin(this.angle) * this.acceleration;

        let velocityMag = Math.sqrt(this.deltaX * this.deltaX + this.deltaY * this.deltaY);

        if (velocityMag > 5)
        {
            this.deltaX /= velocityMag * 0.2;
            this.deltaY /= velocityMag * 0.2;
        }

        this.findDashDirection();

        this.gameObject.x += this.deltaX * ((this.slowed) ? 0.2 : 1);
        this.gameObject.y += this.deltaY * ((this.slowed) ? 0.2 : 1);
    }

    shoot()
    {
        if (keysDown.includes(" ") && (this.shotDelayTimer <= 0) && (this.ammo > 0))
        {
            new Bullet(this.gameState, this);
            this.ammo -= 1;
            this.shotDelayTimer = 3;
        } else {
            this.shotDelayTimer -= 1;

            if (this.ammo < 15)
            {
                this.ammo += Math.max(0, -1 * this.shotDelayTimer * 0.002);
            } else {
                this.ammo = 15;
            }
        }
    }

    dash()
    {
        this.gameObject.x += (15 - this.dashTimer) * this.dashDirection.x;
        this.gameObject.y += (15 - this.dashTimer) * this.dashDirection.y;
        this.deltaX = 5 * this.dashDirection.x;
        this.deltaY = 5 * this.dashDirection.y;

        if (keysDown.includes("ArrowLeft")) this.angle -= Math.PI / 20;
        if (keysDown.includes("ArrowRight")) this.angle += Math.PI / 20;

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

            if (keysDown.includes("x") && this.dashCount >= 1)
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
        ctx.strokeStyle = "Lightgrey"
        ctx.lineWidth = 0.2 * data.gameObject.width;

        ctx.strokeRect(
            data.gameObject.x - data.gameObject.width * 0.5,
            data.gameObject.y - data.gameObject.width * 0.5,
            data.gameObject.width * 2,
            data.gameObject.height * 2
        );

        if (data.state != playerStates.dash)
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

                ctx.fillRect(
                    data.gameObject.x + data.gameObject.height * (0.5 - data.health / 30),
                    data.gameObject.y + data.gameObject.width * (0.5 - data.health / 30),
                    data.gameObject.width * (data.health / 15),
                    data.gameObject.height * (data.health / 15)
                );
            }

        } else {
            ctx.strokeStyle = "rgb(" + Math.round(data.health * 10 + 105) + ", 105, 105)";
            ctx.lineWidth = 8;
            ctx.strokeRect(
                data.gameObject.x,
                data.gameObject.y,
                data.gameObject.width,
                data.gameObject.height
            );
        }

        ctx.fillStyle = "rgb(211, 211, 211)";
        if (data.dashCount >= 1) ctx.fillStyle = "rgb(147, 213, 147)";
        if (data.dashCount >= 2) ctx.fillStyle = "rgb(80, 229, 80)";
        if (data.dashCount == 3) ctx.fillStyle = "rgb(0, 255, 0)";

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

        if (this.ammo != 15)
            ctx.fillRect(
                data.gameObject.x + data.gameObject.width * 
                    (0.3 + xDirection - 0.05 * (Math.max(0, data.shotDelayTimer))),
                data.gameObject.y + data.gameObject.width *
                    (0.3 + yDirection - 0.05 * (Math.max(0, data.shotDelayTimer))),
                data.gameObject.width * (0.4 + 0.1 * (Math.max(0, data.shotDelayTimer))),
                data.gameObject.height * (0.4 + 0.1 * (Math.max(0, data.shotDelayTimer)))
            );

        ctx.fillStyle = "#00f"
        ctx.fillRect(
            data.gameObject.x + data.gameObject.width * (0.5 - (data.ammo / 75) + xDirection),
            data.gameObject.y + data.gameObject.width * (0.5 - (data.ammo / 75) + yDirection),
            data.gameObject.width * 0.4 * (data.ammo / 15),
            data.gameObject.height * 0.4 * (data.ammo / 15)
        );
        
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

        if (this.timer == 110) this.killDash();

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
            if (this.gameState.gameData.dashlines[i].id == this.id)
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

        if (player.state == playerStates.dash)
        {
            this.deltaX +=  (15 - player.dashTimer) * player.dashDirection.x;
            this.deltaY +=  (15 - player.dashTimer) * player.dashDirection.y;
        } else {
            this.deltaX += player.deltaX;
            this.deltaY += player.deltaY;
        }

        this.deltaTotal = Math.sqrt(
            this.deltaX * this.deltaX +
            this.deltaY * this.deltaY
        );

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
            if (this.gameState.gameData.bullets[i].id == this.id)
            {
                this.gameState.gameData.bullets.splice(i, 1);
                return;
            }
        }
    }    
}