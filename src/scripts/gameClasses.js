function pausePressed() {return keysDown.includes(menu.data.controls.pause);}

class GameObject
{
    constructor(x, y, width, height, displayFunction)
    {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.displayFunction = displayFunction;

        this.isPaused = false;
    }

    update(ctx, data)
    {
        this.displayFunction(ctx, data);
    }

    collidesWith(other)
    {
        return (
            ((this.x <= other.x) && ((this.x + this.width) >= other.x)) ||
            ((other.x <= this.x) && ((other.x + other.width) >= this.x))
        ) && (
            ((this.y <= other.y) && ((this.y + this.height) >= other.y)) ||
            ((other.y <= this.y) && ((other.y + other.height) >= this.y))
        );
    }
}

class GameState
{
    constructor(ctx, tickSpeed, callback, pause)
    {
        this.ctx = ctx;

        this.initSession();

        this.tickSpeed = tickSpeed;
        this.endCallback = callback;
        this.pauseMenu = pause;
    }

    initSession()
    {
        this.gameObjects = [];
        this.tempObjects = [];
        this.gameData = {
            player: null,
            enemySpawner: null,
            dashlines: [],
            bullets: [],
            enemies: []
        };
        this.idCounter = 0;
    }

    tick(gameState)
    {
        while (gameState.tempObjects.length > 0)
        {
            let tempObject = gameState.tempObjects.pop();
            gameState.internalObjectAddFunction(tempObject.obj, tempObject.order);
        }
        gameState.ctx.clearRect(0, 0, 500, 500);
        for (let i = 0; i < gameState.gameObjects.length; i++)
        {
            if (gameState.running) gameState.gameObjects[i].update(gameState.ctx);
        }
        for (let i = 0; i < gameState.gameObjects.length; i++)
        {
            if (gameState.gameObjects[i].kill)
            {
                gameState.gameObjects.splice(i, 1);
            }
        }
        if (pausePressed()) gameState.pauseMenu();
    }

    begin(difficulty, type)
    {
        this.running = true;
        this.initSession();
        new EnemySpawner(this, difficulty);
        playerTypes[type].spawn(this);
        this.intervalTracker = setInterval(this.tick, this.tickSpeed, this);
    }

    resume()
    {
        this.isPaused = false;
        this.intervalTracker = setInterval(this.tick, this.tickSpeed, this);
    }

    pause()
    {
        this.isPaused = true;
        clearInterval(this.intervalTracker);
    }

    end()
    {
        clearInterval(this.intervalTracker);
        this.endCallback();
        this.running = false;
    }

    internalObjectAddFunction(gameObject, drawOrder)
    {
        gameObject.id = this.idCounter;
        gameObject.drawOrder = drawOrder;
        gameObject.kill = false;
        this.idCounter++;

        for (let i = 0; i < this.gameObjects.length; i++)
        {
            if (this.gameObjects[i].drawOrder < drawOrder)
            {
                this.gameObjects.splice(i, 0, gameObject);
                return;
            }
        }

        this.gameObjects.push(gameObject);
    }

    addGameObject(object, drawOrder)
    {
        this.tempObjects.push({obj: object, order: drawOrder});
    }

}