const enemyTypes = {
    basic: 0,
    archer: 1,
    archerProjectile: 2
};

const enemyScaling = {
    basic: {
        scaleStart: 0,
        scaleEnd: 0,
        weight: 5
    },

    archer: {
        scaleStart: 1000,
        scaleEnd: 10000,
        weight: 1
    }
}

class EnemySpawner
{
    constructor(gameState)
    {
        this.gameState = gameState;

        this.gameTime = 0;

        this.enemySpawnTimer = 0;
        this.enemySpawnTimerTarget = 50;

        gameState.addGameObject(this, 4);
        gameState.gameData.enemySpawner = this;
    }

    update(ctx)
    {
        this.gameTime += 1;
        this.enemySpawnTimer += 1;
        if (this.enemySpawnTimer > this.enemySpawnTimerTarget)
        {
            this.spawnEnemy();
            this.enemySpawnTimer = 0;
            this.enemySpawnTimerTarget = Math.random() * 50 + 50;
        }
    }

    spawnEnemy()
    {
        let spawnX, spawnY;

        spawnX = Math.random() * 500;
        spawnY = Math.random() * 500;
        
        if (Math.abs(spawnX - 250) > Math.abs(spawnY - 250))
        {
            spawnX = Math.round(spawnX / 500) * 500;
            spawnX += (spawnX == 0)? -50 : 50;
            this.spawnY -= 5;
        } else {
            spawnY = Math.round(spawnX / 500) * 500;
            spawnY += (spawnY == 0)? -50 : 50;
            this.spawnX -= 5;
        }

        if (Math.sqrt(
                Math.pow(this.gameState.gameData.player.gameObject.x - spawnX, 2) + 
                Math.pow(this.gameState.gameData.player.gameObject.y - spawnY, 2)
            ) < 300
        )
        {
            if (this.spawnX < 0) this.spawnX = 550;
            else if (this.spawnX > 500) this.spawnX = -50;
            else if (this.spawnY < 0) this.spawnY = 550;
            else this.spawnY = -50;
        }

        new ArcherEnemy(this.gameState, spawnX, spawnY);
    }

}

class Enemy
{
    constructor(gameState, x, y, width, height, health, damage, type)
    {
        this.gameState = gameState;
     
        this.type = type;
        this.health = health;
        this.damage = damage;
        
        this.enteredArea = false;

        this.stunned = false;

        this.gameObject = new GameObject(
            x, y, width, height, this.draw
        );

        this.gameState.gameData.enemies.push(this);
        gameState.addGameObject(this, 2);
    }

    boundEnemyOnceEntered()
    {
        if (this.enteredArea)
        {
            this.boundToGameArea();
        } else {
            this.enteredArea = this.isFullyInGameArea();

            if (this.enteredArea)
                this.boundToGameArea();
        }
    }

    isFullyInGameArea()
    {
        if (this.gameObject.x < 0) return false;

        if (this.gameObject.y < 0) return false;

        if (this.gameObject.x > 500 - this.gameObject.width) return false;

        if (this.gameObject.y > 500 - this.gameObject.height) return false;
    
        return true;
    }

    boundToGameArea()
    {
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

        if (this.gameObject.x > 500 - this.gameObject.width)
        {
            this.gameObject.x = 500 - this.gameObject.width;
            this.deltaX = 0;
        }

        if (this.gameObject.y > 500 - this.gameObject.height)
        {
            this.gameObject.y = 500 - this.gameObject.height;
            this.deltaY = 0;
        }
    }

    killEnemy()
    {
        this.kill = true;
        this.health = 0;
        for (let i = 0; i < this.gameState.gameData.enemies.length; i++)
        {
            if (this.gameState.gameData.enemies[i].id == this.id)
            {
                this.gameState.gameData.enemies.splice(i, 1);
                return;
            }
        }
    }

    collideWithBullets()
    {
        for (let i = 0; i < this.gameState.gameData.bullets.length; i++)
        {
            if (this.gameObject.collidesWith(this.gameState.gameData.bullets[i].gameObject))
            {
                let bullet = this.gameState.gameData.bullets[i];
                let bulletVelocity = Math.sqrt(
                    bullet.deltaX * bullet.deltaX + bullet.deltaY * bullet.deltaY
                );
                let newVelocity = bulletVelocity - this.health;

                bullet.gameObject.x += bulletVelocity;
                bullet.gameObject.y += bulletVelocity;

                this.health -= bulletVelocity;
                
                if (newVelocity < 1)
                {
                    bullet.deltaX = 0;
                    bullet.deltaY = 0;
                    return;
                }

                bullet.deltaX *= newVelocity * (1 / bulletVelocity);
                bullet.deltaY *= newVelocity * (1 / bulletVelocity);

                bullet.gameObject.x -= newVelocity;
                bullet.gameObject.y -= newVelocity;
                bullet.gameObject.width = 2 * newVelocity;
                bullet.gameObject.height = 2 * newVelocity;

                if (this.health < 0) this.killEnemy();
                return;
            }
        }
    }

    collideWithDashlines()
    {
        this.stunned = false;
        for (let i = 0; i < this.gameState.gameData.dashlines.length; i++)
        {
            if (this.gameObject.collidesWith(this.gameState.gameData.dashlines[i].gameObject))
            {
                this.stunned = true;
                return;
            }
        }
    }

    canDamagePlayer(player)
    {
        return !((player.state == playerStates.dash) || this.stunned);
    }
}

class BasicEnemy extends Enemy
{
    constructor(gameState, x, y)
    {
        super(gameState, x, y, 10, 10, 5, 1, enemyTypes.basic);
     
        this.power = 1;
        this.maxSpeed = 3;
        this.acceleration = 1;

        this.deltaX = 0;
        this.deltaY = 0;
    }

    move()
    {
        let player = this.gameState.gameData.player;

        let playerCenterX = (player.gameObject.x + player.gameObject.width * 0.5);
        let playerCenterY = (player.gameObject.y + player.gameObject.height * 0.5);

        let enemyCenterX = (this.gameObject.x + this.gameObject.width * 0.5);
        let enemyCenterY = (this.gameObject.y + this.gameObject.height * 0.5);

        this.deltaX += this.acceleration * (playerCenterX > enemyCenterX) ? 0.1 : -0.1;
        this.deltaY += this.acceleration * (playerCenterY > enemyCenterY) ? 0.1 : -0.1;

        let velocityMag = Math.sqrt(this.deltaX * this.deltaX + this.deltaY * this.deltaY);

        if ((enemyCenterX + this.deltaX > playerCenterX) != (this.deltaX < 0))
            this.deltaX *= 1 - (this.power - 1) * 0.005;

        if ((enemyCenterY + this.deltaY > playerCenterY) != (this.deltaY < 0))
            this.deltaY *= 1 - (this.power - 1) * 0.005;

        let newSpeed = Math.sqrt(this.deltaX * this.deltaX + this.deltaY * this.deltaY);
        
        this.deltaX /= newSpeed / velocityMag;
        this.deltaY /= newSpeed / velocityMag;

        if (velocityMag > this.maxSpeed)
        {
            this.deltaX /= velocityMag / this.maxSpeed;
            this.deltaY /= velocityMag / this.maxSpeed;
        }

        this.collideWithDashlines();

        if (this.stunned == false)
        {
            this.gameObject.x += this.deltaX;
            this.gameObject.y += this.deltaY;
        }
    }

    update(ctx)
    {
        this.move();
        this.boundToGameArea();

        if (this.health < 0) return;
        this.collideWithBullets();

        this.mergeWithBasicEnemies();

        this.gameObject.update(ctx, this);
    }

    mergeWithBasicEnemies()
    {
        if (this.health == 0) return;
        for (let i = 0; i < this.gameState.gameData.enemies.length; i++)
        {
            if (
                this.gameObject.collidesWith(
                    this.gameState.gameData.enemies[i].gameObject
                ) && (this.gameState.gameData.enemies[i].id != this.id) &&
                (this.gameState.gameData.enemies[i].type == enemyTypes.basic)
            )
            {
                
                if(this.power > this.gameState.gameData.enemies[i].power)
                {
                    this.addPower(this.gameState.gameData.enemies[i]);
                    this.gameState.gameData.enemies[i].killEnemy();
                } else {
                    this.gameState.gameData.enemies[i].addPower(this);
                    this.killEnemy();
                }
            }
        }
    }

    addPower(enemy)
    {
        this.power += enemy.power;
        this.gameObject.x -= enemy.power;
        this.gameObject.y -= enemy.power;
        this.gameObject.width += enemy.power * 2;
        this.gameObject.height += enemy.power * 2;
        this.health += enemy.health;
        this.damage += enemy.power * 1;
        this.maxSpeed = this.power * 0.1 + 2.99;
    }

    draw(ctx, data)
    {
        if (!data.stunned)
        {
            ctx.fillStyle = "Black";
            ctx.fillRect(
                data.gameObject.x,
                data.gameObject.y,
                data.gameObject.width,
                data.gameObject.height
            );
        } else {
            ctx.strokeStyle = "Gray";
            ctx.lineWidth = 4;
            ctx.strokeRect(
                data.gameObject.x,
                data.gameObject.y,
                data.gameObject.width,
                data.gameObject.height
            );
        }
    }
}

class ArcherEnemy extends Enemy
{
    constructor(gameState, x, y)
    {
        super(gameState, x, y, 14, 14, 2, 0.5, enemyTypes.archer)
     
        this.maxSpeed = 5;
        this.acceleration = 5;
        this.shotTimer = 0;

        this.deltaX = 0;
        this.deltaY = 0;
        this.theta = Math.atan2(
            y - gameState.gameData.player.gameObject.y,
            x - gameState.gameData.player.gameObject.x
        );
        this.deltaTheta = 0.01 * ((Math.random() > 0.5) ? 1 : -1);
    }

    update(ctx)
    {
        this.move();
        this.boundEnemyOnceEntered();
        this.shoot();

        if (this.health < 0) return;
        this.collideWithBullets();

        this.gameObject.update(ctx, this);
    }

    shoot()
    {
        if (this.health == 0 || this.stunned) return;

        let velocityMag = Math.sqrt(this.deltaX * this.deltaX + this.deltaY * this.deltaY);
        
        this.shotTimer += 1 / (velocityMag + 1);

        if (this.shotTimer > 30)
        {
            this.shotTimer = 0;

            new ArcherProjectile(
                this.gameState,
                this.gameObject.x,
                this.gameObject.y,
                Math.atan2(
                    this.gameState.gameData.player.gameObject.y - this.gameObject.y,
                    this.gameState.gameData.player.gameObject.x - this.gameObject.x
                )
            );
        }
    }

    move()
    {
        this.theta += this.deltaTheta;

        let player = this.gameState.gameData.player;

        let targetCenterX = (
            player.gameObject.x + player.gameObject.width * 0.5 + 200 * Math.cos(this.theta)
        );
        let targetCenterY = (
            player.gameObject.y + player.gameObject.height * 0.5 + 200 * Math.sin(this.theta)
        );

        if (!this.enteredArea)
        {
            targetCenterX = player.gameObject.x + player.gameObject.width * 0.5;
            targetCenterY = player.gameObject.y + player.gameObject.height * 0.5;
        }

        if ((targetCenterX < 0 || targetCenterX > 500 ||
            targetCenterY < 0 || targetCenterY > 500)
        )
        {
            let newTargetCenterX = (
                player.gameObject.x + player.gameObject.width * 0.5 + 200 * Math.cos(
                    this.theta + -10 * this.deltaTheta
                )
            );
            let newTargetCenterY = (
                player.gameObject.y + player.gameObject.height * 0.5 + 200 * Math.sin(
                    this.theta + -10 * this.deltaTheta
                )
            );            

            if (!(newTargetCenterX < 0 || newTargetCenterX > 500 ||
                newTargetCenterY < 0 || newTargetCenterY > 500)
            )
            {
                this.deltaTheta *= -1;
                this.theta += this.deltaTheta * 10;
            }
        }

        let enemyCenterX = (this.gameObject.x + this.gameObject.width * 0.5);
        let enemyCenterY = (this.gameObject.y + this.gameObject.height * 0.5);

        this.deltaX += this.acceleration * (targetCenterX > enemyCenterX) ? 0.1 : -0.1;
        this.deltaY += this.acceleration * (targetCenterY > enemyCenterY) ? 0.1 : -0.1;

        let velocityMag = Math.sqrt(this.deltaX * this.deltaX + this.deltaY * this.deltaY);

        if (velocityMag > this.maxSpeed)
        {
            this.deltaX /= velocityMag / this.maxSpeed;
            this.deltaY /= velocityMag / this.maxSpeed;
        }

        this.collideWithDashlines();

        if (this.stunned == false)
        {
            this.gameObject.x += this.deltaX;
            this.gameObject.y += this.deltaY;
        } else {
            this.gameObject.x += this.deltaX * 0.2;
            this.gameObject.y += this.deltaY * 0.2;
        }
    }

    draw(ctx, data)
    {
        ctx.fillStyle = "Black";
        ctx.fillRect(
            data.gameObject.x,
            data.gameObject.y,
            data.gameObject.width,
            data.gameObject.height
        );
    }
}

class ArcherProjectile extends Enemy
{
    constructor(gameState, x, y, angle)
    {
        super(gameState, x, y, 10, 10, 1, 0.5, enemyTypes.archerProjectile);

        this.deltaX = Math.cos(angle) * 5;
        this.deltaY = Math.sin(angle) * 5;
    }

    update(ctx)
    {
        this.move();

        if (this.health < 0) return;
        this.collideWithDashlines();

        if (this.stunned == true) this.killEnemy();

        this.gameObject.update(ctx, this);
    }

    move()
    {
        this.gameObject.x += this.deltaX;
        this.gameObject.y += this.deltaY;

        if ((this.gameObject.x < (-1 * this.gameObject.width)) ||
            (this.gameObject.y < (-1 * this.gameObject.height)) ||
            (this.gameObject.x > (this.gameObject.width + 500)) ||
            (this.gameObject.y > (this.gameObject.height + 500))
        ) this.killEnemy();
    }

    draw(ctx, data)
    {
        ctx.fillStyle = "Grey";
        ctx.fillRect(
            data.gameObject.x,
            data.gameObject.y,
            data.gameObject.width,
            data.gameObject.height
        );
    }
}