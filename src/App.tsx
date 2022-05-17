import "./Grid.less";
import React from "react";
const ROW = 25;
const COL = 50;

const classnames = (...args: any[]): string => {
  const isEmpty = (v: any) => [undefined, null, 0, "", false].includes(v);
  return args.reduce((acc, cur) => {
    if (isEmpty(cur)) return acc;
    if (typeof cur === "string" || typeof cur === "number") {
      return `${acc} ${cur}`;
    }
    if (Array.isArray(cur)) {
      const result = classnames(...cur);
      return `${acc}${isEmpty(result) ? "" : " ".concat(result)}`;
    }
    if (typeof cur === "object") {
      const result = Object.keys(cur)
        .filter((key) => !isEmpty(cur[key]))
        .join(" ");
      return `${acc}${isEmpty(result) ? "" : " ".concat(result)}`;
    }
    return acc;
  }, "");
};

enum EGridStatus {
  empty,
  snake,
  food,
}

enum EGameStatus {
  stop = "stop",
  running = "running",
  over = "over",
}

const createGridData = () => {
  const data = Array.from({ length: ROW })
    .fill(Array.from({ length: COL }).fill(EGridStatus.empty))
    .map((v) => [...v]);
  return data;
};

const gridData = createGridData();
const checkIsDead = (dataSource: { x: number; y: number }) => {
  return (
    dataSource.x >= COL ||
    dataSource.y >= ROW ||
    dataSource.x < 0 ||
    dataSource.y < 0
  );
};
function App() {
  const [snake, setSnake] = React.useState([
    { x: 24, y: 12 },
    { x: 24, y: 13 },
    { x: 24, y: 14 },
  ]);
  const [direction, setDirection] = React.useState("w");
  const [gameStatus, setGameStatus] = React.useState(EGameStatus.stop);

  const merge = ({ effectData, value, gridData }) => {
    const effectDataMap = effectData.reduce((acc, cur) => {
      if (!acc[cur.y]) acc[cur.y] = [];
      acc[cur.y].push(cur.x);
      return acc;
    }, {});
    return gridData.map((row, i) => {
      if (!effectDataMap[i]) return row;
      const nextRow = [...row];
      effectDataMap[i].forEach((x) => (nextRow[x] = value));
      return nextRow;
    });
  };

  const snakeRun = (nextGameStatus = gameStatus, nextDirection = direction) => {
    if ([EGameStatus.stop, EGameStatus.over].includes(nextGameStatus)) {
      return console.log("game", nextGameStatus);
    }
    let nextHead = null as any;
    switch (nextDirection) {
      case "w":
        nextHead = { x: snake[0].x, y: snake[0].y - 1 };
        break;
      case "d":
        nextHead = { x: snake[0].x + 1, y: snake[0].y };
        break;

      case "s":
        nextHead = { x: snake[0].x, y: snake[0].y + 1 };
        break;

      case "a":
        nextHead = { x: snake[0].x - 1, y: snake[0].y };
        break;
    }

    if (checkIsDead(nextHead)) {
      return setGameStatus(EGameStatus.over);
    }
    setSnake([nextHead].concat(snake.slice(0, snake.length - 1)));
  };

  React.useEffect(() => {
    const timer = setInterval(snakeRun, 100);
    if ([EGameStatus.over, EGameStatus.stop].includes(gameStatus)) {
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [snake, gameStatus, direction]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (direction === e.key) {
      return console.log("repeat");
    }

    if ([EGameStatus.over].includes(gameStatus)) {
      return console.log("game", gameStatus);
    }

    const validKey = ["w", "d", "s", "a"];
    if (!validKey.includes(e.key)) return;

    switch (e.key) {
      case "w":
        if (direction === "s") return;
        break;
      case "d":
        if (direction === "a") return;
        break;

      case "s":
        if (direction === "w") return;
        break;

      case "a":
        if (direction === "d") return;
        break;
    }

    setDirection(e.key);
    if (gameStatus !== EGameStatus.over) {
      setGameStatus(EGameStatus.running);
      snakeRun(EGameStatus.running, e.key);
    }
  };

  React.useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [gridData, snake, gameStatus]);

  return (
    <div style={{ color: "white" }} className="app">
      <p>{direction}</p>
      <p style={{ margin: 10 }}>{gameStatus}</p>

      <div className="grid-wrap">
        {gameStatus === EGameStatus.over && (
          <p style={{ position: "absolute", color: "red" }}>game over</p>
        )}
        {merge({
          gridData,
          effectData: snake,
          value: EGridStatus.snake,
        })
          .flat()
          .map((v, i) => {
            return (
              <div
                key={`${i}-${v}`}
                className={classnames("grid-item", {
                  green: v === EGridStatus.snake,
                })}
              />
            );
          })}
      </div>
    </div>
  );
}

export default App;
