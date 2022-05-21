import "./Grid.less";
import React from "react";
type TGridDataItem = { x: number; y: number; value: EGridStatus };

const ROW = 25;
const COL = 20;
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
  const result: TGridDataItem[][] = [];
  for (let i = 0; i < ROW; i++) {
    result[i] = [];
    for (let j = 0; j < COL; j++) {
      result[i].push({ x: j, y: i, value: EGridStatus.empty });
    }
  }
  return result;
};

const gridData = createGridData();
const checkIsDead = ({
  dataSource,
  effectData,
}: {
  dataSource: TGridDataItem;
  effectData: TGridDataItem[];
}) => {
  return (
    dataSource.x >= COL ||
    dataSource.y >= ROW ||
    dataSource.x < 0 ||
    dataSource.y < 0 ||
    effectData.some(
      (item) => item.x === dataSource.x && item.y === dataSource.y
    )
  );
};

const createRandomFood = ({
  gridData,
  effectData,
}: {
  gridData: TGridDataItem[][];
  effectData: TGridDataItem[];
}) => {
  const effectDataMap = effectData.reduce((acc, cur) => {
    if (!acc[cur.y]) acc[cur.y] = [];
    acc[cur.y].push(cur);
    return acc;
  }, {} as { [key: number]: TGridDataItem[] });
  const filteredData = gridData
    .map((row, i) => {
      if (!effectDataMap[i]) return row;
      return row.filter((colItem) => {
        const matchItem = effectDataMap[i].find(
          (effectItem) => effectItem.x === colItem.x
        );
        return !matchItem;
      });
    })
    .flat();

  const result = {
    ...filteredData[(filteredData.length * Math.random()) | 0],
    value: EGridStatus.food,
  };
  return result;
};

const defaultSnake = [
  { x: COL / 2, y: (ROW / 2) | 0, value: EGridStatus.snake },
  { x: COL / 2, y: ((ROW / 2) | 0) + 1, value: EGridStatus.snake },
  { x: COL / 2, y: ((ROW / 2) | 0) + 2, value: EGridStatus.snake },
];

const defaultFood = createRandomFood({
  gridData,
  effectData: defaultSnake,
});

function App() {
  const [snake, setSnake] = React.useState(defaultSnake);
  const [food, setFood] = React.useState(defaultFood);
  const [direction, setDirection] = React.useState("w");
  const [gameStatus, setGameStatus] = React.useState(EGameStatus.stop);

  const merge = ({
    gridData,
    effectData,
  }: {
    gridData: TGridDataItem[][];
    effectData: TGridDataItem[];
  }) => {
    const effectDataMap = effectData.reduce((acc, cur) => {
      if (!acc[cur.y]) acc[cur.y] = [];
      acc[cur.y].push(cur);
      return acc;
    }, {} as { [key: number]: TGridDataItem[] });

    const mergedData = gridData.map((row, i) => {
      if (!effectDataMap[i]) return row;
      return row.map((colItem) => {
        const matchItem = effectDataMap[i].find(
          (effectItem) => effectItem.x === colItem.x
        );
        return matchItem ? matchItem : colItem;
      });
    });
    return mergedData;
  };

  const snakeRun = (nextGameStatus = gameStatus, nextDirection = direction) => {
    if ([EGameStatus.stop, EGameStatus.over].includes(nextGameStatus)) {
      return console.log("game", nextGameStatus);
    }

    let nextHead: TGridDataItem = snake[0];
    switch (nextDirection) {
      case "w":
        nextHead = { ...snake[0], x: snake[0].x, y: snake[0].y - 1 };
        break;
      case "d":
        nextHead = { ...snake[0], x: snake[0].x + 1, y: snake[0].y };
        break;

      case "s":
        nextHead = { ...snake[0], x: snake[0].x, y: snake[0].y + 1 };
        break;

      case "a":
        nextHead = { ...snake[0], x: snake[0].x - 1, y: snake[0].y };
        break;
    }

    if (checkIsDead({ dataSource: nextHead, effectData: snake })) {
      return setGameStatus(EGameStatus.over);
    }
    const isMatchFood = nextHead.x === food.x && nextHead.y === food.y;
    if (isMatchFood) {
      const nextSnake = [nextHead].concat(snake);
      setSnake(nextSnake);
      setFood(createRandomFood({ effectData: nextSnake, gridData }));
    } else {
      setSnake([nextHead].concat(snake.slice(0, snake.length - 1)));
    }
  };

  React.useEffect(() => {
    const timer = setInterval(snakeRun, 100);
    if ([EGameStatus.over, EGameStatus.stop].includes(gameStatus)) {
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [snake, gameStatus, direction]);

  const handleKeyDown = (e: KeyboardEvent) => {
    const validKey = ["w", "d", "s", "a", " "];
    const eKey =
      {
        ArrowUp: "w",
        ArrowRight: "d",
        ArrowDown: "s",
        ArrowLeft: "a",
      }[e.key] || e.key;
    if (!validKey.includes(eKey)) return;

    const handleDirection = () => {
      if (direction === eKey) {
        return console.log("repeat");
      }
      if ([EGameStatus.over].includes(gameStatus)) {
        return;
      }
      setDirection(eKey);
      if (gameStatus !== EGameStatus.over) {
        setGameStatus(EGameStatus.running);
        snakeRun(EGameStatus.running, eKey);
      }
    };

    switch (eKey) {
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
      case " ": {
        if (gameStatus === EGameStatus.over) {
          return location.reload();
        }
        if (gameStatus === EGameStatus.stop) {
          setGameStatus(EGameStatus.running);
          snakeRun(EGameStatus.running, direction);
        } else {
          setGameStatus(EGameStatus.stop);
        }
        return;
      }
    }

    handleDirection();
  };

  React.useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [gridData, snake, gameStatus]);

  return (
    <div className="app">
      <div className="debug-panel">
        <p>direction: {direction}</p>
        <p>gameStatus: {gameStatus}</p>
        <p>eat: {snake.length - 3}</p>
      </div>
      {gameStatus === EGameStatus.over && (
        <p className="game-over-wrap">game over</p>
      )}
      <div className="grid-wrap" style={{ maxWidth: 12 * COL }}>
        {merge({
          gridData,
          effectData: snake.concat(food),
        }).map((row, rowKey) => {
          return (
            <React.Fragment key={rowKey}>
              {row.map((item, colKey) => (
                <div
                  key={`${colKey}-${item.value}`}
                  className={classnames("grid-item", {
                    green:
                      item.value === EGridStatus.snake ||
                      item.value === EGridStatus.food,
                  })}
                />
              ))}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

export default App;
