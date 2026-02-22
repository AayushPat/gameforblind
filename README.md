# EchoPath

EchoPath is an audio-first exploration game designed to be fully playable by visually impaired users.

Instead of relying on visuals, players navigate the world using spatial sound, narration, and environmental audio cues.

The objective is to explore the environment, locate hidden checkpoints, avoid danger zones, and reach the final destination using sound alone.

---

## Gameplay

Players move through an open map searching for 10 hidden checkpoints.

Each checkpoint is communicated through:

- Directional sound
- Volume changes based on distance
- Narrated feedback

Some sounds guide players toward progress, while others signal danger that should be avoided.

Once all checkpoints are located, players must navigate to the final location to complete the game.

---

## Accessibility

EchoPath was designed with blind accessibility as the primary experience.

Core accessibility elements include:

- Positional audio navigation
- Narrated feedback
- Distance-based sound cues
- Intuition-driven exploration
- No reliance on visual gameplay

The game can be played entirely through sound.

---

## Controls

| Key | Action |
|-----|--------|
| W / Up Arrow | Move Forward |
| S / Down Arrow | Move Backward |
| A / Left Arrow | Move Left |
| D / Right Arrow | Move Right |

All gameplay feedback is delivered through audio.

---

## Audio System

The game communicates information using layered sound design.

Audio conveys:

- Direction
- Distance
- Threat
- Progress

Examples:

- Increasing volume indicates proximity to checkpoints
- Stereo panning communicates direction
- Unique sounds distinguish checkpoints from hazards

Narration works alongside ambient sound to provide continuous awareness of surroundings.

---

## Tech Stack

- JavaScript
- HTML5 Canvas
- FMOD
- Web Audio API

---

## Purpose

EchoPath explores inclusive game design through audio-first mechanics.

Rather than adapting a visual game for blind users, this experience is built from the ground up around non-visual navigation.

---

## Running the Game

Clone the repository:
