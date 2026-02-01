# Lite2D

A lightweight game framework for 2D pixel-based web games.

## Features

- **Canvas-based Rendering**: 2D rendering using HTML5 Canvas
- **GameObject Hierarchy**: Cocos2D-style game object system
- **Tree Structure**: Parent-child relationship support
- **Update -> Render Loop**: Clear game loop structure
- **Transform System**: Position, rotation, and scale management
- **Physics System**: 2D rigid body dynamics and collision detection
- **Audio System**: BGM/SFX playback with fade effects
- **Input Management**: Keyboard/mouse input handling
- **Resource Loading**: Async image/audio loading with caching
- **TypeScript**: Full type support

## Project Structure

```
lite2d/
├── src/                  # Source code
│   ├── core/            # Core classes (Engine, GameObject, Scene, Transform)
│   ├── rendering/       # Rendering (Sprite, Camera)
│   ├── input/           # Input management
│   ├── physics/         # Physics system
│   ├── audio/           # Audio system
│   ├── utils/           # Utilities
│   └── assets/          # Resource loading
├── examples/            # Example projects
│   └── basic/          # Basic example
├── docs/               # Documentation
└── dist/              # Build output
```

## Getting Started

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Open `http://localhost:8080` in your browser to see the basic example.

### Production Build

```bash
npm run build
```

### Type Check

```bash
npm run type-check
```

## Quick Example

```typescript
import { Engine, Scene, GameObject, Vector2 } from "./src/index";

// Initialize engine
const engine = new Engine("gameCanvas", 800, 600);

// Create scene
const scene = new Scene("MainScene", 800, 600);
scene.backgroundColor = "#1a1a2e";

// Create player
class Player extends GameObject {
  onUpdate(deltaTime: number): void {
    const input = this.scene?.engine?.inputManager;
    if (input?.isKeyDown("ArrowRight")) {
      this.transform.translate(new Vector2(200 * deltaTime, 0));
    }
  }
}

const player = new Player("Player");
player.transform.position = new Vector2(400, 300);
scene.addGameObject(player);

// Start game
await engine.loadScene(scene);
engine.start();
```

## Core Classes

### Core

- **Engine**: Game loop and engine management
- **GameObject**: Base class for all game objects
- **Scene**: Game scene management
- **Transform**: Position/rotation/scale management
- **Component**: Extensible component system

### Rendering

- **Sprite**: 2D image rendering
- **Camera**: Camera and viewport management

### Physics

- **PhysicsManager**: Physics system management
- **RigidBody**: Rigid body component
- **BoxCollider/CircleCollider**: AABB and circle colliders

### Audio

- **SoundManager**: Sound playback management
- **AudioSource**: Audio component for GameObjects

### Input

- **InputManager**: Keyboard/mouse input handling

### Assets

- **AssetLoader**: Resource loading and caching

### Utils

- **Vector2**: 2D vector operations
- **MathUtils**: Math utility functions

## Documentation

For more details, see the [docs](./docs/README.md) folder:

- [Architecture](docs/architecture.md) - Framework structure and design
- [API Reference](docs/api.md) - Class and method reference
- [Game Loop](docs/gameloop.md) - Update/Render loop behavior
- [Physics System](docs/physics.md) - 2D physics and collision
- [Audio System](docs/audio.md) - Sound playback and management
- [Tutorial](docs/tutorial.md) - Getting started guide

## Running Examples

To run the basic example:

1. Start dev server: `npm run dev`
2. Open `http://localhost:8080` in browser
3. Use arrow keys to move, Space to rotate

## Tech Stack

- **TypeScript**: Type safety
- **Webpack**: Module bundling
- **Canvas API**: 2D rendering
- **requestAnimationFrame**: Game loop

## License

MIT License

## Contributing

Issues and Pull Requests are welcome!
