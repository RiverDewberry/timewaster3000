const enemyTypes = {
    basic: 0,
    archer: 1,
    archerProjectile: 2,
    dash: 3,
    dashLine: 4,
    tank: 5
};

const enemyScaling = [
    {
        scaleStart: 0,
        scaleEnd: 0,
        fullWeight: 10,
        delayFactor: 0.5,
        spawn: function(gs, x, y) {new BasicEnemy(gs, x, y);},
        curentWeight: null
    },

    {
        scaleStart: 10,
        scaleEnd: 130,
        fullWeight: 4,
        delayFactor: 1.25,
        spawn: function(gs, x, y) {new ArcherEnemy(gs, x, y);},
        curentWeight: null
    },

    {
        scaleStart: 70,
        scaleEnd: 220,
        fullWeight: 3,
        delayFactor: 2,
        spawn: function(gs, x, y) {new DashEnemy(gs, x, y);},
        curentWeight: null
    },

    {
        scaleStart: 170,
        scaleEnd: 340,
        fullWeight: 2,
        delayFactor: 5,
        spawn: function(gs, x, y) {new TankEnemy(gs, x, y);},
        curentWeight: null
    },

    {
        scaleStart: 50,
        scaleEnd: 400,
        fullWeight: 1,
        delayFactor: 10,
        spawn: function(gs, x, y) {

            let playerX = gameState.gameData.player.gameObject.x;
            let playerY = gameState.gameData.player.gameObject.y;

            if (playerX === 250 && playerY === 250)
            {
                playerX += Math.random();
                playerY += Math.random();
            }

            playerX -= 250;
            playerY -= 250;

            let theta = Math.atan2(playerY, playerX);
            theta += Math.PI - 0.9;

            for (let i = 0; i < 7; i++)
            {
                theta += 0.3;

                let spawnX, spawnY;

                spawnX = Math.cos(theta) * 375;
                spawnY = Math.sin(theta) * 375;

                new BasicEnemy(gs, spawnX + 250, spawnY + 250);
            }
        },
        curentWeight: null
    },

    {
        scaleStart: 450,
        scaleEnd: 2000,
        fullWeight: 2,
        delayFactor: 5,
        spawn: function(gs, x, y) {
            let temp = enemyScaling.splice(5, enemyScaling.length - 5);

            let delay = 0;

            for (let i = 0; i < 10; i++)
            {
                delay += gameState.gameData.enemySpawner.enemySpawnTimerTarget;
                gameState.gameData.enemySpawner.spawnEnemy();
            }

            delay *= 0.40;

            gameState.gameData.enemySpawner.enemySpawnTimerTarget += delay;
            enemyScaling.splice(5, 0, ...temp);
        }
    }
];

for (let i = 0; i < enemyScaling.length; i++)
{
    enemyScaling[i].scaleStart *= 40;
    enemyScaling[i].scaleEnd *= 40;
}

class EnemySpawner
{
    constructor(gameState, difficulty)
    {
        this.gameState = gameState;

        this.difficulty = difficulty;
        this.gameTime = 0;

        this.enemySpawnTimer = 0;
        this.enemySpawnTimerTarget = 50;

        gameState.addGameObject(this, 5);
        gameState.gameData.enemySpawner = this;
    }

    update(ctx)
    {
        this.gameTime += this.difficulty;
        this.enemySpawnTimer += 1;
        if (this.enemySpawnTimer > this.enemySpawnTimerTarget)
        {
            this.spawnEnemy();
            this.enemySpawnTimer = 0;
        }

        this.draw(this.gameState.ctx, this);
    }

    draw(ctx, data)
    {
        ctx.font = "15px Monospace";
        ctx.fillStyle = "Black";
        ctx.fillText(Math.round(data.gameTime * 0.025), 5, 15);
    }

    getSpawnLocation()
    {
        let spawnX = Math.random() * 500;
        let spawnY = Math.random() * 500;

        if (Math.abs(spawnX - 250) > Math.abs(spawnY - 250))
        {
            spawnX = Math.round(spawnX / 500) * 500;
            spawnX += (spawnX === 0)? -50 : 50;
            spawnY -= 5;
        } else {
            spawnY = Math.round(spawnX / 500) * 500;
            spawnY += (spawnY === 0)? -50 : 50;
            spawnX -= 5;
        }

        if (Math.sqrt(
                Math.pow(this.gameState.gameData.player.gameObject.x - spawnX, 2) + 
                Math.pow(this.gameState.gameData.player.gameObject.y - spawnY, 2)
            ) < 300
        )
        {
            if (spawnX < 0) spawnX = 550;
            else if (spawnX > 500) spawnX = -50;
            else if (spawnY < 0) spawnY = 550;
            else spawnY = -50;
        }

        return {x: spawnX, y: spawnY};
    }

    spawnEnemy()
    {
        let spawnLocation = this.getSpawnLocation();
        let spawnX = spawnLocation.x;
        let spawnY = spawnLocation.y;

        let totalWeight = 0;
        for (let i = 0; i < enemyScaling.length; i++)
        {
            if (enemyScaling[i].scaleStart > this.gameTime)
                enemyScaling[i].curentWeight = 0;
            else if (enemyScaling[i].scaleEnd <= this.gameTime)
                enemyScaling[i].curentWeight = enemyScaling[i].fullWeight;
            else {
                enemyScaling[i].curentWeight = ((this.gameTime - enemyScaling[i].scaleStart) /
                (enemyScaling[i].scaleEnd - enemyScaling[i].scaleStart)) *
                enemyScaling[i].fullWeight
            }

            totalWeight += enemyScaling[i].curentWeight;
        }

        let tempNumber = Math.random() * totalWeight;

        for (let i = 0; i < enemyScaling.length; i++)
        {
            tempNumber -= enemyScaling[i].curentWeight;
            if (tempNumber < 0)
            {
                this.enemySpawnTimerTarget = 
                    Math.random() * 50 * enemyScaling[i].delayFactor + 50;

                enemyScaling[i].spawn(this.gameState, spawnX, spawnY);
                break;
            }
        }
    }
}

class Enemy
{
    constructor(gameState, x, y, width, height, health, damage, type, updateOrder)
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
        gameState.addGameObject(this, updateOrder);
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
            if (this.gameState.gameData.enemies[i].id === this.id)
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
                
                let newVelocity = bulletVelocity - this.takeDamage(bulletVelocity);

                bullet.gameObject.x += bulletVelocity;
                bullet.gameObject.y += bulletVelocity;
                
                if (newVelocity < 1)
                {
                    bullet.deltaX = 0;
                    bullet.deltaY = 0;
                }

                bullet.deltaX *= newVelocity * (1 / bulletVelocity);
                bullet.deltaY *= newVelocity * (1 / bulletVelocity);

                bullet.gameObject.x -= newVelocity;
                bullet.gameObject.y -= newVelocity;
                bullet.gameObject.width = 2 * newVelocity;
                bullet.gameObject.height = 2 * newVelocity;

                return;
            }
        }
    }

    takeDamage(amount)
    {
        let oldHealth = this.health;
        this.health -= amount;
        if (this.health < 0)
        {
            this.killEnemy();
            this.health = 0;
            return oldHealth;
        }
        return amount;
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
        return !((player.state === playerStates.dash) || this.stunned);
    }
}

class BasicEnemy extends Enemy
{
    constructor(gameState, x, y)
    {
        super(gameState, x, y, 10, 10, 5, 1, enemyTypes.basic, 2);
     
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

        if ((enemyCenterX + this.deltaX > playerCenterX) !== (this.deltaX < 0))
            this.deltaX *= 1 - (this.power - 1) * 0.005;

        if ((enemyCenterY + this.deltaY > playerCenterY) !== (this.deltaY < 0))
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

        if (this.stunned === false)
        {
            this.gameObject.x += this.deltaX;
            this.gameObject.y += this.deltaY;
        }
    }

    update(ctx)
    {
        this.move();
        this.boundEnemyOnceEntered();

        if (this.health < 0) return;
        this.collideWithBullets();

        this.mergeWithBasicEnemies();

        this.gameObject.update(ctx, this);
    }

    mergeWithBasicEnemies()
    {
        if (this.health === 0) return;
        for (let i = 0; i < this.gameState.gameData.enemies.length; i++)
        {
            if (
                this.gameObject.collidesWith(
                    this.gameState.gameData.enemies[i].gameObject
                ) && (this.gameState.gameData.enemies[i].id !== this.id) &&
                (this.gameState.gameData.enemies[i].type === enemyTypes.basic)
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
        super(gameState, x, y, 14, 14, 8, 1, enemyTypes.archer, 2)
     
        this.maxSpeed = 5;
        this.acceleration = 5;
        this.shotTimer = 0;

        this.deltaX = 0;
        this.deltaY = 0;
        this.theta = 0.5 + Math.atan2(
            y - gameState.gameData.player.gameObject.y,
            x - gameState.gameData.player.gameObject.x
        );
        this.deltaTheta = 0.01 * ((Math.random() > 0.5) ? 1 : -1);
        
        this.shotAngle = 0;
        this.getShotAngle();
    }

    update(ctx)
    {
        this.move();
        this.boundEnemyOnceEntered();
        this.getShotAngle();
        this.shoot();

        if (this.health < 0)
        {
            this.killEnemy();
            return;
        }
        this.collideWithBullets();

        this.gameObject.update(ctx, this);
    }

    shoot()
    {
        if (this.health === 0 || this.stunned) return;

        let velocityMag = Math.sqrt(this.deltaX * this.deltaX + this.deltaY * this.deltaY);
        
        this.shotTimer += 1 / (velocityMag + 1);

        if (this.shotTimer > 20)
        {
            this.shotTimer = 0;

            new ArcherProjectile(
                this.gameState,
                this.gameObject.x,
                this.gameObject.y,
                this.shotAngle
            );
        }
    }

    getShotAngle()
    {
        let playerObject = this.gameState.gameData.player.gameObject;
        let player = this.gameState.gameData.player;

        let distToPlayer = Math.sqrt(
            Math.pow(playerObject.y + 5 - this.gameObject.y, 2) +
            Math.pow(playerObject.x + 5- this.gameObject.x, 2)
        );

        this.shotAngle = Math.atan2(
            playerObject.y + 5 + (player.deltaY * distToPlayer * 0.05) - this.gameObject.y,
            playerObject.x + 5 + (player.deltaX * distToPlayer * 0.05) - this.gameObject.x
        )
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

        if (this.stunned === false)
        {
            this.gameObject.x += this.deltaX;
            this.gameObject.y += this.deltaY;
        } else {
            this.gameObject.x += this.deltaX * 0.1;
            this.gameObject.y += this.deltaY * 0.1;
        }
    }

    draw(ctx, data)
    {
        ctx.fillStyle = "Black";
        ctx.fillRect(
            data.gameObject.x,
            data.gameObject.y,
            data.gameObject.width,
            data.gameObject.height,
        );
        ctx.strokeStyle = "LightGrey";
        ctx.lineWidth = 4;
        ctx.strokeRect(
            data.gameObject.x - 7,
            data.gameObject.y - 7,
            data.gameObject.width + 14,
            data.gameObject.height + 14,
        );

        let xDirection = Math.cos(data.shotAngle);
        let yDirection = Math.sin(data.shotAngle);
        let directionScale = Math.max(Math.abs(xDirection), Math.abs(yDirection));
        xDirection /= directionScale;
        yDirection /= directionScale;

        ctx.fillStyle = "Grey";
        ctx.fillRect(
            data.gameObject.x + 4 + 14 * xDirection,
            data.gameObject.y + 4 + 14 * yDirection,
            6,
            6,
        );        
    }

    canDamagePlayer(player)
    {
        return !(player.state === playerStates.dash);
    }
}

class ArcherProjectile extends Enemy
{
    constructor(gameState, x, y, angle)
    {
        let xDirection = Math.cos(angle);
        let yDirection = Math.sin(angle);
        let directionScale = Math.max(Math.abs(xDirection), Math.abs(yDirection));
        xDirection /= directionScale;
        yDirection /= directionScale;

        super(
            gameState,
            x + 2 + 14 * xDirection,
            y + 2 + 14 * yDirection,
            10,
            10,
            1,
            2,
            enemyTypes.archerProjectile,
            2
        );

        this.deltaX = Math.cos(angle) * 5;
        this.deltaY = Math.sin(angle) * 5;
    }

    update(ctx)
    {
        this.move();

        if (this.health < 0) return;
        this.collideWithDashlines();

        if (this.stunned === true) this.killEnemy();

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

class DashEnemy extends Enemy
{
    constructor(gameState, x, y)
    {
        super(gameState, x, y, 12, 12, 3, 1, enemyTypes.dash, 2)
     
        this.maxSpeed = 4;
        this.acceleration = 4;
        this.shotTimer = 0;

        this.deltaX = 0;
        this.deltaY = 0;
        this.theta = 1 + Math.atan2(
            y - gameState.gameData.player.gameObject.y,
            x - gameState.gameData.player.gameObject.x
        );
        this.deltaTheta = 0.03 * ((Math.random() > 0.5) ? 1 : -1);

        this.dashDirection = {x: 0, y: 0};
        this.dashTimer = 10;
    }

    findDashDirection()
    {
        let player = this.gameState.gameData.player;
        let targetCenterX = player.gameObject.x + player.gameObject.width * 0.5;
        let targetCenterY = player.gameObject.y + player.gameObject.height * 0.5;
        let enemyCenterX = this.gameObject.x + this.gameObject.width * 0.5;
        let enemyCenterY = this.gameObject.y + this.gameObject.height * 0.5;

        if (
            Math.abs(targetCenterX - enemyCenterX) >
            Math.abs(targetCenterY - enemyCenterY)
        )
        {
            this.dashDirection.y = 0;
            this.dashDirection.x = ((targetCenterX - enemyCenterX) > 0) ? 1 : -1;
        } else {
            this.dashDirection.x = 0;
            this.dashDirection.y = ((targetCenterY - enemyCenterY) > 0) ? 1 : -1;
        }
    }

    move()
    {
        if (this.dashTimer < 10)
        {
            if (this.dashTimer === 0)
            {
                new EnemyDashEffect(this.gameState, this);
            }
            this.dash();

            return;
        } else this.findDashDirection();

        this.collideWithDashlines();
        if (!this.stunned)
        {
            this.dashTimer += 1;
            if (this.dashTimer > 50) this.dashTimer = 0;
        }

        this.theta += this.deltaTheta;

        let player = this.gameState.gameData.player;

        let targetCenterX = (
            player.gameObject.x + player.gameObject.width * 0.5 + 100 * Math.cos(this.theta)
        );
        let targetCenterY = (
            player.gameObject.y + player.gameObject.height * 0.5 + 100 * Math.sin(this.theta)
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
                player.gameObject.x + player.gameObject.width * 0.5 + 100 * Math.cos(
                    this.theta + -10 * this.deltaTheta
                )
            );
            let newTargetCenterY = (
                player.gameObject.y + player.gameObject.height * 0.5 + 100 * Math.sin(
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

        if (this.stunned === false)
        {
            this.gameObject.x += this.deltaX;
            this.gameObject.y += this.deltaY;
        } else {
            this.gameObject.x += this.deltaX * 0.2;
            this.gameObject.y += this.deltaY * 0.2;
        }
    }

    dash()
    {
        this.gameObject.x += (15 - this.dashTimer) * this.dashDirection.x;
        this.gameObject.y += (15 - this.dashTimer) * this.dashDirection.y;
        this.deltaX = (15 - this.dashTimer) * this.dashDirection.x;
        this.deltaY = (15 - this.dashTimer) * this.dashDirection.y;

        if (keysDown.includes("ArrowLeft")) this.angle -= Math.PI / 20;
        if (keysDown.includes("ArrowRight")) this.angle += Math.PI / 20;

        this.deltaX += 5 * this.dashDirection.x;
        this.deltaY += 5 * this.dashDirection.y;
        this.dashTimer += 1;
    }

    update(ctx)
    {
        this.move();
        this.boundEnemyOnceEntered();

        if (this.health < 0)
        {
            this.killEnemy();
            return;
        }

        if (this.dashTimer >= 10) this.collideWithBullets();

        this.gameObject.update(ctx, this);
    }

    draw(ctx, data)
    {
        if (data.dashTimer >= 10)
        {
            ctx.strokeStyle = "Lightgrey"
            ctx.lineWidth = 4;

            ctx.strokeRect(
                data.gameObject.x - 6,
                data.gameObject.y - 6,
                data.gameObject.width + 12,
                data.gameObject.height + 12
            );

            ctx.fillStyle = "Black";
            ctx.fillRect(
                data.gameObject.x,
                data.gameObject.y,
                data.gameObject.width,
                data.gameObject.height
            );

            ctx.fillStyle = "Grey";
            ctx.fillRect(
                data.gameObject.x + data.gameObject.width * 
                (data.dashDirection.x - Math.abs(data.dashDirection.y)) + 4,
                data.gameObject.y + data.gameObject.width *
                (data.dashDirection.y - Math.abs(data.dashDirection.x)) + 4,
                4 + 24 * Math.abs(data.dashDirection.y),
                4 + 24 * Math.abs(data.dashDirection.x)
            );

        } else {
            ctx.strokeStyle = "Grey"
            ctx.lineWidth = 4;

            ctx.strokeRect(
                data.gameObject.x,
                data.gameObject.y,
                data.gameObject.width,
                data.gameObject.height
            );
        }
    }

    canDamagePlayer(player)
    {
        return !((player.state === playerStates.dash) || (this.dashTimer < 10));
    }
}

class EnemyDashEffect extends Enemy
{
    constructor(gameState, enemy)
    {
        super(
            gameState,
            enemy.gameObject.x + 0.5 * enemy.gameObject.width - 2,
            enemy.gameObject.y + 0.5 * enemy.gameObject.width - 2,
            4, 4, 5, 2, enemyTypes.dashLine, 3
        );

        this.timer = 0;
        this.kill = false;

        this.direction = {x: enemy.dashDirection.x, y: enemy.dashDirection.y};
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

        if (this.timer === 110) this.killEnemy();

        this.timer += 1;

        this.gameObject.update(ctx, this);
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

class TankEnemy extends Enemy
{
    constructor(gameState, x, y)
    {
        super(gameState, x, y, 30, 30, 100, 5, enemyTypes.tank, 2);

        this.deltaX = 0;
        this.deltaY = 0;
        this.shield = 50;
        this.shieldTimer = 0;
        
        this.shieldWidth = this.shield * 0.4;
        this.gameObject.x -= this.shieldWidth * 0.5;
        this.gameObject.y -= this.shieldWidth * 0.5;
        this.gameObject.width += this.shieldWidth;
        this.gameObject.height += this.shieldWidth;

        this.isFollowing = false;
    }

    takeDamage(amount)
    {
        this.shieldTimer = -100;

        if (amount < this.shield)
        {
            this.shield -= amount;
            return amount;
        } else {
            let trueDamage = amount - this.shield;
            let oldHealth = this.health;

            this.shield = 0;

            this.health -= trueDamage;

            if (this.health <= 0)
            {
                this.killEnemy();
                return oldHealth;
            }

            this.gameObject.width -= trueDamage * 0.1;
            this.gameObject.height -= trueDamage * 0.1;
            this.gameObject.x += trueDamage * 0.1;
            this.gameObject.y += trueDamage * 0.1;
            this.damage -= trueDamage * 0.04;
        }

        return amount;
    }

    canDamagePlayer(player)
    {
        return !(player.state === playerStates.dash);
    }

    healShield()
    {
        this.shield += Math.min(Math.max(this.shieldTimer * 0.001, 0), 0.5);
        this.shieldTimer += 1;
        if (this.shield > 50) this.shield = 50;
    }

    move()
    {
        let leader = this.getLeaderTank();

        if (leader !== null)
        {
            this.deltaX = leader.deltaX;
            this.deltaY = leader.deltaY;
            this.gameObject.x += this.deltaX;
            this.gameObject.y += this.deltaY;
            this.enteredArea = false;
            this.isFollowing = true;
            return;
        }
        this.isFollowing = false;

        let player = this.gameState.gameData.player.gameObject;

        this.deltaX = player.x + 0.5 * player.width - this.gameObject.x - 0.5 *
            this.gameObject.width;
        this.deltaY = player.y + 0.5 * player.height - this.gameObject.y - 0.5 *
            this.gameObject.height;

        let velocityMag = Math.sqrt(this.deltaX * this.deltaX + this.deltaY * this.deltaY);

        this.deltaX /= velocityMag;
        this.deltaY /= velocityMag;

        this.gameObject.x += this.deltaX;
        this.gameObject.y += this.deltaY;
    }

    getLeaderTank()
    {
        if (this.health === 0) return null;

        this.gameObject.x += this.shieldWidth * 0.5 - 20;
        this.gameObject.y += this.shieldWidth * 0.5 - 20;
        this.gameObject.width -= this.shieldWidth - 40;
        this.gameObject.height -= this.shieldWidth - 40;

        for (let i = 0; i < this.gameState.gameData.enemies.length; i++)
        {
            if (this.gameState.gameData.enemies[i].id === this.id) break;

            if (
                this.gameObject.collidesWith(
                    this.gameState.gameData.enemies[i].gameObject
                ) && (this.gameState.gameData.enemies[i].type === enemyTypes.tank)
            )
            {
                this.gameObject.x -= this.shieldWidth * 0.5 - 20;
                this.gameObject.y -= this.shieldWidth * 0.5 - 20;
                this.gameObject.width += this.shieldWidth - 40;
                this.gameObject.height += this.shieldWidth - 40;

                return this.gameState.gameData.enemies[i];
            }
        }

        this.gameObject.x -= this.shieldWidth * 0.5 - 20;
        this.gameObject.y -= this.shieldWidth * 0.5 - 20;
        this.gameObject.width += this.shieldWidth - 40;
        this.gameObject.height += this.shieldWidth - 40;

        return null;
    }

    update(ctx)
    {
        this.gameObject.x += this.shieldWidth * 0.5;
        this.gameObject.y += this.shieldWidth * 0.5;
        this.gameObject.width -= this.shieldWidth;
        this.gameObject.height -= this.shieldWidth;

        this.shieldWidth = this.shield * 0.4;
        
        this.gameObject.x -= this.shieldWidth * 0.5;
        this.gameObject.y -= this.shieldWidth * 0.5;
        this.gameObject.width += this.shieldWidth;
        this.gameObject.height += this.shieldWidth;

        this.move();

        if(!this.isFollowing) this.boundEnemyOnceEntered();
        
        this.collideWithDashlines();

        if (this.stunned) {
            this.shield -= 1;
            if (this.shield < 0) this.shield = 0;
        } else this.healShield();
        
        this.collideWithBullets();

        this.gameObject.update(ctx, this);
    }
    
    draw(ctx, data)
    {
        
        if (data.shield > 0)
        {
            ctx.strokeStyle = "Gray";
            ctx.lineWidth = data.shield * 0.4;
            ctx.strokeRect(
                data.gameObject.x + data.shieldWidth * 0.5,
                data.gameObject.y + data.shieldWidth * 0.5,
                data.gameObject.width - data.shieldWidth,
                data.gameObject.height - data.shieldWidth
            );
        }

        ctx.fillStyle = "Black";
        ctx.fillRect(
            data.gameObject.x + data.shieldWidth * 0.5,
            data.gameObject.y + data.shieldWidth * 0.5,
            data.gameObject.width - data.shieldWidth,
            data.gameObject.height - data.shieldWidth
        );
    }
}