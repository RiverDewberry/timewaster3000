class GameObject
{
    constructor(x, y, width, height, displayFunction)
    {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.displayFunction = displayFunction;
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
    constructor(canvasID, width, height, tickSpeed)
    {
        this.canvas = document.getElementById(canvasID);
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx = this.canvas.getContext("2d");
        this.gameObjects = [];
        this.tempObjects = [];
        this.gameData = {
            player: null,
            enemySpawner: null,
            dashlines: [],
            bullets: [],
            enemies: []
        };
        this.tickSpeed = tickSpeed;
        this.idCounter = 0;
    }

    tick(gameState)
    {
        while (gameState.tempObjects.length > 0)
        {
            let tempObject = gameState.tempObjects.pop();
            gameState.internalObjectAddFunction(tempObject.obj, tempObject.order);
        }
        gameState.ctx.clearRect(0, 0, gameState.canvas.width, gameState.canvas.height)
        for (let i = 0; i < gameState.gameObjects.length; i++)
        {
            gameState.gameObjects[i].update(gameState.ctx);
        }
        for (let i = 0; i < gameState.gameObjects.length; i++)
        {
            if (gameState.gameObjects[i].kill)
            {
                gameState.gameObjects.splice(i, 1);
            }
        }
    }

    start()
    {
        this.intervalTracker = setInterval(this.tick, this.tickSpeed, this);
    }

    stop()
    {
        clearInterval(this.intervalTracker)
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