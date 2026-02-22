# WittenYeh.github.io

A personal website featuring an interactive Three-Body Problem simulation.

## Features

- **Three-Body Problem Simulation**: Real-time physics simulation using Verlet integration
- **Lagrange Configuration**: Three equal-mass bodies in a stable equilateral triangle orbit
- **Interactive Controls**:
  - Reset button to restart the simulation
  - Toggle trails to show/hide orbital paths
- **Responsive Design**: Works on desktop and mobile devices

## Physics

The simulation implements the gravitational three-body problem using:
- **Verlet Integration**: A numerical method for integrating Newton's equations of motion
- **Lagrange Equilateral Triangle Solution**: A stable configuration where three equal masses orbit their common center of mass

## Live Demo

Visit [https://wittenyeh.github.io](https://wittenyeh.github.io) to see the simulation in action.

## Technologies

- Pure HTML5, CSS3, and JavaScript
- Canvas API for rendering
- No external dependencies

## Local Development

To run locally:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

## License

MIT License
