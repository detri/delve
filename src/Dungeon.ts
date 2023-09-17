type TileType = "floor" | "wall";
type Pos = [number, number];

interface Tile {
  pos: Pos;
  tileType: TileType;
}

type TileMap = Map<string, Tile>;

interface Dungeon {
  tiles: TileMap;
  blockedTiles: Pos[];
  revealedTiles: Pos[];
  visibleTiles: Pos[];
}
