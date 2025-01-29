import Phaser from "phaser";
import { createInitialGameState, tickGame, reassignWorker, startResearch } from "./game";
import { GameState, TaskState } from "./types";

export default class MainScene extends Phaser.Scene {
  gameState: GameState;
  resourceText!: Phaser.GameObjects.Text;
  taskTexts: Record<string, Phaser.GameObjects.Text> = {};
  buttons: Record<string, Phaser.GameObjects.Text> = {};

  constructor() {
    super("MainScene");
    this.gameState = createInitialGameState();
  }

  preload() {
    // Load assets here if needed (e.g., background images, icons)
  }

  create() {
    this.createUI();
    this.time.addEvent({ delay: 1000, callback: this.updateGame, callbackScope: this, loop: true });
  }

  createUI() {
    this.add.text(20, 20, "Prehistoric Tech Game", { fontSize: "24px", color: "#fff" });

    // Resource Display
    this.resourceText = this.add.text(20, 60, this.getResourceText(), { fontSize: "18px", color: "#fff" });

    // Create Task Cards
    let yOffset = 150;
    Object.entries(this.gameState.tasks).forEach(([taskId, task]) => {
      // Create background rectangle for card
      this.add.rectangle(20, yOffset, 600, 105, 0x333333)
        .setOrigin(0, 0)
        .setAlpha(0.5);

      // Add task info text
      this.taskTexts[taskId] = this.add.text(35, yOffset + 15, this.getTaskText(taskId), 
        { fontSize: "16px", color: "#fff" });

      // Add Buttons on a new line
      if (task.state === TaskState.Discovered) {
        this.buttons[`${taskId}-minus`] = this.add
          .text(35, yOffset + 55, "[-]", { fontSize: "16px", color: "#f00" })
          .setInteractive()
          .on("pointerdown", () => this.handleReassign(taskId, "unassigned"));

        this.buttons[`${taskId}-plus`] = this.add
          .text(75, yOffset + 55, "[+]", { fontSize: "16px", color: "#0f0" })
          .setInteractive()
          .on("pointerdown", () => this.handleReassign("unassigned", taskId));
      }

      // Add Research Button for Imagined Tasks
      if (task.state === TaskState.Imagined) {
        this.buttons[`${taskId}-research`] = this.add
          .text(35, yOffset + 55, "[Think About This]", { fontSize: "16px", color: "#00f" })
          .setInteractive()
          .on("pointerdown", () => this.handleStartResearch(taskId));
      }

      yOffset += 125;
    });
  }

  updateGame() {
    this.gameState = tickGame(this.gameState);
    this.updateUI();
  }

  updateUI() {
    this.resourceText.setText(this.getResourceText());

    Object.entries(this.gameState.tasks).forEach(([taskId, task]) => {
      this.taskTexts[taskId].setText(this.getTaskText(taskId));
    });
  }

  getResourceText(): string {
    return `🍖 Food: ${this.gameState.resources.food} | 🧠 Thought Rate: ${
      Object.values(this.gameState.tasks).reduce(
        (sum, t) => sum + (t.productionPerWorker.thoughts ?? 0) * t.assignedWorkers,
        0
      )
    } | 👥 Total: ${this.gameState.population.total} | 🕊️ Unassigned: ${this.gameState.population.unassigned}`;
  }

  getTaskText(taskId: string): string {
    const task = this.gameState.tasks[taskId];
    let text = `${formatTaskTitle(taskId)} - ${getTaskStateLabel(task.state)}`;

    if (task.state === TaskState.Discovered) {
      text += ` | Workers: ${task.assignedWorkers}`;
    }

    if (task.state === TaskState.Imagined) {
      const progress = (task.researchProgress.toDiscoveredCurrent / task.researchProgress.toDiscoveredRequired) * 100;
      text += ` | Research Progress: ${progress.toFixed(0)}%`;
    }

    return text;
  }

  handleReassign(fromTask: string, toTask: string) {
    this.gameState = reassignWorker(this.gameState, fromTask, toTask);
    this.updateUI();
  }

  handleStartResearch(taskId: string) {
    this.gameState = startResearch(this.gameState, taskId);
    this.updateUI();
  }
}

// Utility Functions
function formatTaskTitle(taskId: string): string {
  const titles: Record<string, string> = {
    foodGathering: "🌾 Food Gathering",
    thinkingL1: "🤔 Thinking Level 1",
    hunting: "🏹 Hunting",
  };
  return titles[taskId] || taskId;
}

function getTaskStateLabel(state: TaskState): string {
  switch (state) {
    case TaskState.Unthoughtof:
      return "????";
    case TaskState.Imagined:
      return "🔎 Imagined";
    case TaskState.Discovered:
      return "✅ Discovered";
    default:
      return "";
  }
}
