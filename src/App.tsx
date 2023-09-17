import { useEffect, useRef, useState } from "react";
import Display from "rot-js/lib/display/display";
import Digger from "rot-js/lib/map/digger";
import "./App.css";

function App() {
  const displayRef = useRef(
    new Display({
      width: 80,
      height: 50,
      fontFamily: "monospace",
      fontSize: 12,
      forceSquareRatio: true,
    })
  );
  const displayContainerRef = useRef<HTMLElement | null>(null);
  const [dungeon, _setDungeon] = useState(
    new Digger(80, 50, {
      dugPercentage: 0.3,
      roomHeight: [5, 10],
      roomWidth: [8, 12],
    })
  );
  const [showing, setShowing] = useState(false);

  useEffect(() => {
    if (showing) {
      return;
    }
    const container = displayRef.current.getContainer();
    if (displayContainerRef.current && container) {
      displayContainerRef.current.appendChild(container);
      displayRef.current.draw(0, 0, "@", "white", null);
      dungeon.create(displayRef.current.DEBUG);
      setShowing(true);
    }
  }, [displayContainerRef.current, displayRef.current, showing, dungeon]);

  return <div ref={(e) => (displayContainerRef.current = e)} />;
}

export default App;
