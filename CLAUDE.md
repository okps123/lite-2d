# Lite2D Project

A lightweight game framework for 2D pixel-based web games.

## Tech Stack

- **Language**: TypeScript
- **Build**: Webpack (with dev server)
- **Rendering**: HTML5 Canvas 2D
- **Package Manager**: npm

## Project Structure

```
src/
├── core/           # Core classes (Engine, GameObject, Scene, Transform, Component)
├── rendering/      # Rendering (Sprite, Camera)
├── input/          # Input handling (InputManager)
├── assets/         # Resource loading (AssetLoader)
├── physics/        # Physics system (RigidBody, Collider, PhysicsManager)
├── audio/          # Audio system (SoundManager, AudioSource)
└── utils/          # Utilities (Vector2, MathUtils)
```

## Architecture Key Concepts

### 1. GameObject Inheritance (Cocos2D Style)
- All game objects inherit from `GameObject` class
- Tree structure support (parent-child relationships)
- Component system for extensibility

### 2. Game Loop
```
requestAnimationFrame → Delta Time calculation → Update → Render → Next frame
```

### 3. Lifecycle Methods
```
awake() → start() → update(deltaTime) → render(ctx) → destroy()
```

## Coding Conventions

### Extending GameObject
```typescript
// ✅ Correct: Override onUpdate/onRender
class Player extends GameObject {
  onUpdate(deltaTime: number): void {
    // Custom update logic
  }

  onRender(ctx: CanvasRenderingContext2D): void {
    // Custom rendering (Transform already applied)
  }
}

// ❌ Wrong: Do NOT override update/render directly
```

### Modifying Transform (IMPORTANT!)
```typescript
// ❌ Wrong - dirty flag is NOT set
this.transform.position.x += 10;

// ✅ Correct - use translate() (recommended)
this.transform.translate(new Vector2(10, 0));

// ✅ Correct - use setter
this.transform.position = new Vector2(
  this.transform.position.x + 10,
  this.transform.position.y
);

// ✅ Same for rotation
this.transform.rotate(Math.PI / 4);
```

**Reason**: Transform caches world transform for performance optimization. Directly modifying position.x does not set the dirty flag, so the world transform won't be updated.

### Using Physics System
```typescript
// When RigidBody is attached, use RigidBody methods instead of modifying Transform directly
const rb = gameObject.getComponent(RigidBody);
rb.setVelocity(new Vector2(100, 0));
rb.addImpulse(new Vector2(0, -500));
```

## Key Classes

| Class | Purpose |
|-------|---------|
| `Engine` | Game loop, Canvas, manager coordination |
| `Scene` | GameObject container, includes Camera |
| `GameObject` | Base for all game objects |
| `Transform` | Position/rotation/scale (dirty flag caching) |
| `Component` | Reusable functionality unit |
| `Sprite` | 2D image rendering |
| `Camera` | Viewport, coordinate transformation |
| `InputManager` | Keyboard/mouse input |
| `AssetLoader` | Resource loading and caching |
| `PhysicsManager` | Physics simulation |
| `RigidBody` | Rigid body physics component |
| `BoxCollider/CircleCollider` | Collision shapes |
| `SoundManager` | Audio playback management |
| `AudioSource` | Audio component for GameObjects |

## Commands

```bash
# Run development server
npm run dev

# Production build
npm run build

# Install dependencies
npm install
```

## Documentation

- [Architecture](docs/architecture.md) - Framework structure and design
- [API Reference](docs/api.md) - Class and method reference
- [Game Loop](docs/gameloop.md) - Update/Render loop behavior
- [Physics System](docs/physics.md) - 2D physics and collision
- [Audio System](docs/audio.md) - Sound playback and management
- [Tutorial](docs/tutorial.md) - Getting started guide

## Important Notes

1. **Transform Modification**: Always use `translate()`, `rotate()` methods or setters
2. **Lifecycle**: Override `onUpdate()`/`onRender()` instead of `update()`/`render()`
3. **Delta Time**: Always multiply by deltaTime for frame-independent behavior
4. **Physics Objects**: Avoid direct Transform modification when RigidBody is attached
5. **Rendering**: Never modify state in `render()`, state changes go in `update()`

## Design Patterns

- **Component Pattern**: GameObject + Component structure
- **Composite Pattern**: GameObject hierarchy
- **Game Loop Pattern**: requestAnimationFrame-based loop
- **Dirty Flag Pattern**: Transform optimization
- **Object Pool Pattern**: AssetLoader caching
