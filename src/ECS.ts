export namespace ECS {
  type Components = {
    [component: Component["type"]]: ComponentBucket<Component>;
  };

  type ComponentBucket<T extends Component> = Set<T>;

  type Entity = number;
  type Entities = Set<Entity>;
  type System = (commands: Commands) => void;

  interface QueryResult {
    entity: Entity;
    components: { [key: Component["type"]]: Component };
  }

  interface SystemBuckets {
    startup: Set<System>;
    update: Set<System>;
  }

  interface Component {
    entity: Entity;
    type: string;
  }

  /**
   * Higher order helper function to pass external resources
   * to a system
   */
  function makeSystem<T>(
    resource: T,
    systemCallback: (sysResource: T, commands: Commands) => void
  ): System {
    return (commands: Commands) => systemCallback(resource, commands);
  }

  /**
   * Exposes the ECS world during System execution.
   * Note: this is passed into a System by a World
   * and is not meant to be instantiated directly.
   */
  class Commands {
    private world: World;

    constructor(world: World) {
      this.world = world;
    }

    public addEntity(entity: Entity, components?: Component[]): Entity {
      this.world.entities.add(entity);
      components?.forEach((component) => {
        this.addComponent(entity, component);
      });
      this.world._entityRegistered();
      return entity;
    }

    public removeEntity(entity: Entity) {
      this.world.entities.delete(entity);
      const allBuckets = Object.values(this.world.components);
      allBuckets.forEach((bucket) => {
        bucket.forEach((component) => {
          if (component.entity === entity) {
            bucket.delete(component);
          }
        });
      });
    }

    public addComponent<T extends Component>(entity: Entity, component: T) {
      this.world.components[component.type].add({ ...component, entity });
    }

    public query(componentTypes: Component["type"][]): QueryResult[] {
      const queryResults: QueryResult[] = [];
      const entityMap: Map<
        Entity,
        Map<Component["type"], Component>
      > = new Map();

      componentTypes.forEach((type) => {
        const bucket = this.world.components[type];
        bucket.forEach((component) => {
          const { entity } = component;
          if (!entityMap.has(entity)) {
            entityMap.set(entity, new Map());
          }
          const mappedEntity = entityMap.get(entity)!;
          mappedEntity.set(component.type, component);
        });
      });

      entityMap.forEach((components, entity) => {
        queryResults.push({
          entity,
          components: Object.fromEntries(components.entries()),
        });
      });

      return queryResults;
    }
  }

  class World {
    public entities: Entities;
    public components: Components;
    public systems: SystemBuckets;

    private commands: Commands;
    private ranStartup: boolean = false;
    private entityCount: number;

    constructor() {
      this.entityCount = 0;
      this.entities = new Set<Entity>();
      this.components = {};
      this.systems = {
        startup: new Set<System>(),
        update: new Set<System>(),
      };
      this.commands = new Commands(this);
    }

    public register<T extends Component>(type: T["type"]): this {
      this.components[type] = new Set<T>() as ComponentBucket<T>;
      return this;
    }

    public start() {
      if (!this.ranStartup) {
        this.systems.startup.forEach((sys) => {
          sys(this.commands);
        });
        this.ranStartup = true;
      }
    }

    public tick() {
      this.systems.update.forEach((sys) => {
        sys(this.commands);
      });
    }

    public _entityRegistered() {
      this.entityCount++;
    }
  }
}
