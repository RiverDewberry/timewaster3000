const gameState = new GameState("gameCanvas", 500, 500, 25);

new Player(gameState);

new EnemySpawner(gameState);

gameState.start();